'use client';

import { Song } from "@/types";
import useLoadImage from "@/hooks/useLoadImage";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";

interface LrcLine {
  time: number;
  text: string;
}

function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const raw of lrc.split('\n')) {
    const match = raw.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (!match) continue;
    const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
    const text = match[3].trim();
    if (text) lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

type LyricsState = 'idle' | 'loading' | 'synced' | 'plain' | 'none';

interface LyricsFlipCardProps {
  song: Song;
  position: number;
  duration: number; // needed for 85% cutoff
}

// ─── Title cleaning ────────────────────────────────────────────────────────────
// Strips YouTube noise so we get clean artist/track strings for lrclib queries.
const NOISE_RE = /\b(official\s*(music\s*)?video|official\s*audio|official\s*lyric\s*video|lyric\s*video|lyrics?|audio|video|vevo|topic|hd|hq|4k|live|performance|visualizer|explicit|clean|remix|remaster(?:ed)?|feat\.?|ft\.?|prod\.?(\s*by)?|x\s+|\(.*?\)|\[.*?\])/gi;

function cleanTitle(raw: string): string {
  return raw
    .replace(NOISE_RE, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Given a YouTube title and channel name, produce an ordered list of
// { artist, track } candidates to try against lrclib.
function buildCandidates(rawTitle: string, rawChannel: string): { artist: string; track: string }[] {
  const channel = cleanTitle(rawChannel.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim());
  const fullCleaned = cleanTitle(rawTitle);

  // Try to split on the FIRST " - " in the cleaned title
  const dashIdx = fullCleaned.indexOf(' - ');
  const left = dashIdx !== -1 ? fullCleaned.slice(0, dashIdx).trim() : '';
  const right = dashIdx !== -1 ? fullCleaned.slice(dashIdx + 3).trim() : '';

  const candidates: { artist: string; track: string }[] = [];

  if (left && right) {
    // "Artist - Track" pattern found in title
    candidates.push({ artist: left, track: right });           // title split, normal order
    candidates.push({ artist: right, track: left });           // title split, swapped (rare but happens)
    candidates.push({ artist: channel, track: right });        // channel as artist, right as track
    candidates.push({ artist: channel, track: left });         // channel as artist, left as track
    candidates.push({ artist: channel, track: fullCleaned });  // channel + full cleaned title
  } else {
    // No " - " in title — treat full title as track
    candidates.push({ artist: channel, track: fullCleaned });
    candidates.push({ artist: '', track: fullCleaned });
  }

  // Always add a track-only fallback at the end
  candidates.push({ artist: '', track: right || fullCleaned });

  // Deduplicate
  const seen = new Set<string>();
  return candidates.filter(c => {
    const key = `${c.artist}||${c.track}`;
    if (seen.has(key) || !c.track) return false;
    seen.add(key);
    return true;
  });
}

async function queryLrclib(artist: string, track: string): Promise<any | null> {
  // Try exact /get first (faster, more precise)
  try {
    const params = new URLSearchParams({ track_name: track });
    if (artist) params.set('artist_name', artist);
    const res = await fetch(`https://lrclib.net/api/get?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics || data.plainLyrics) return data;
    }
  } catch (_) {}

  // Fall back to /search
  try {
    const q = artist ? `${artist} ${track}` : track;
    const res = await fetch(`https://lrclib.net/api/search?${new URLSearchParams({ q })}`);
    if (res.ok) {
      const results = await res.json();
      if (results?.length > 0) {
        return results.find((r: any) => r.syncedLyrics)
          || results.find((r: any) => r.plainLyrics)
          || null;
      }
    }
  } catch (_) {}

  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const LyricsFlipCard: React.FC<LyricsFlipCardProps> = ({ song, position, duration }) => {
  const imageUrl = useLoadImage(song);

  const [flipped, setFlipped] = useState(false);
  const [lyricsState, setLyricsState] = useState<LyricsState>('idle');
  const [syncedLines, setSyncedLines] = useState<LrcLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState('');
  const [activeLine, setActiveLine] = useState(0);

  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track which song we've fetched for, and retry state
  const fetchedForRef = useRef('');
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidatesRef = useRef<{ artist: string; track: string }[]>([]);
  const candidateIndexRef = useRef(0);
  const isFetchingRef = useRef(false);

  const processLyricsData = useCallback((data: any) => {
    if (data.syncedLyrics) {
      setSyncedLines(parseLrc(data.syncedLyrics));
      setLyricsState('synced');
    } else if (data.plainLyrics) {
      setPlainLyrics(data.plainLyrics);
      setLyricsState('plain');
    } else {
      setLyricsState('none');
    }
  }, []);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Try the next candidate in the list; schedule retry if none left yet
  const tryNextCandidate = useCallback(async () => {
    if (isFetchingRef.current) return;

    const candidates = candidatesRef.current;
    const idx = candidateIndexRef.current;

    // Past 85% of duration — give up
    if (duration > 0 && position >= duration * 0.85) {
      clearRetry();
      setLyricsState('none');
      return;
    }

    if (idx >= candidates.length) {
      // All candidates exhausted for this cycle — retry full list again in 2s
      candidateIndexRef.current = 0;
      retryTimerRef.current = setTimeout(tryNextCandidate, 2000);
      return;
    }

    isFetchingRef.current = true;
    const { artist, track } = candidates[idx];
    candidateIndexRef.current = idx + 1;

    try {
      const data = await queryLrclib(artist, track);
      if (data) {
        clearRetry();
        processLyricsData(data);
      } else {
        // This candidate failed — try next immediately
        isFetchingRef.current = false;
        tryNextCandidate();
      }
    } catch (_) {
      isFetchingRef.current = false;
      tryNextCandidate();
    }

    isFetchingRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, position, processLyricsData, clearRetry]);

  // Start fetching when activeID changes (song starts)
  const startFetch = useCallback(() => {
    const key = `${song.id}::${song.title}`;
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    clearRetry();
    isFetchingRef.current = false;
    candidateIndexRef.current = 0;
    candidatesRef.current = buildCandidates(song.title, song.author ?? '');

    setLyricsState('loading');
    setSyncedLines([]);
    setPlainLyrics('');
    setActiveLine(0);

    tryNextCandidate();
  }, [song.id, song.title, song.author, clearRetry, tryNextCandidate]);

  // Reset + start fetch when song changes
  useEffect(() => {
    fetchedForRef.current = '';
    setFlipped(false);
    startFetch();
    return () => clearRetry();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id]);

  // Active line tracking
  useEffect(() => {
    if (lyricsState !== 'synced' || !syncedLines.length) return;
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
      if (position >= syncedLines[i].time) idx = i;
      else break;
    }
    setActiveLine(idx);
  }, [position, syncedLines, lyricsState]);

  // Auto-scroll to active line
  useEffect(() => {
    if (flipped && lyricsState === 'synced') {
      activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine, flipped, lyricsState]);

  // If lyrics failed and retry is still running — stop at 85%
  useEffect(() => {
    if (lyricsState !== 'loading' && lyricsState !== 'idle') return;
    if (duration > 0 && position >= duration * 0.85) {
      clearRetry();
      if (lyricsState === 'loading') setLyricsState('none');
    }
  }, [position, duration, lyricsState, clearRetry]);

  const renderLyricsContent = () => {
    if (lyricsState === 'loading' || lyricsState === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-y-4">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent animate-spin" />
          <p className="font-mono text-[10px] text-red-600 animate-pulse tracking-widest">DECIPHERING_SIGNAL...</p>
        </div>
      );
    }
    if (lyricsState === 'none') {
      return (
        <div className="flex flex-col items-center justify-center h-full px-10 text-center">
          <p className="text-red-900/40 font-mono text-[10px] uppercase tracking-widest leading-loose">
            Error_404<br />Signal_Lost<br />No_Lyrics_Found
          </p>
        </div>
      );
    }
    if (lyricsState === 'plain') {
      return (
        <div className="overflow-y-auto h-full px-6 py-8 scrollbar-hide">
          {plainLyrics.split('\n').map((line, i) => (
            <p key={i} className="text-neutral-400 font-mono text-xs leading-relaxed mb-1 uppercase">
              {line || <br />}
            </p>
          ))}
        </div>
      );
    }

    return (
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto h-full px-6 py-20 space-y-6 scrollbar-hide"
      >
        {syncedLines.map((line, i) => (
          <p
            key={i}
            ref={i === activeLine ? activeLineRef : null}
            className={`leading-tight transition-all duration-500 uppercase italic tracking-tighter ${
              i === activeLine
                ? 'text-white text-xl font-black scale-105 origin-left'
                : 'text-red-900/30 text-sm font-bold blur-[0.5px]'
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-y-4 w-full">
      <div
        className="w-full relative"
        style={{
          perspective: '1200px',
          height: flipped ? '400px' : '280px',
          transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
          maxWidth: flipped ? '100%' : '280px',
        }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front — album art */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 rounded-none border border-red-900/20 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            <Image
              fill
              src={imageUrl ?? '/images/likedit.png'}
              alt={song.title}
              className="object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              sizes="280px"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
            {/* Small indicator dot — green if lyrics ready, amber if loading, red if none */}
            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
              lyricsState === 'synced' || lyricsState === 'plain' ? 'bg-green-500' :
              lyricsState === 'none' ? 'bg-red-600' :
              'bg-amber-400 animate-pulse'
            }`} />
          </div>

          {/* Back — lyrics */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 rounded-none bg-neutral-950 border border-red-600/30 shadow-[0_0_40px_rgba(239,68,68,0.1)] overflow-hidden"
          >
            <div className="absolute top-2 left-2 font-mono text-[8px] text-red-600/20 uppercase">
              LYRIC_STREAM_V3.0
            </div>
            <div className="absolute bottom-2 right-2 font-mono text-[8px] text-red-600/20 uppercase">
              {String(song.id).slice(0, 8)}
            </div>
            {renderLyricsContent()}
          </div>
        </div>
      </div>

      <button
        onClick={() => setFlipped(f => !f)}
        className="group flex flex-col items-center"
      >
        <p className="text-red-600/40 font-mono text-[9px] uppercase tracking-[0.3em] group-hover:text-red-500 transition-colors">
          {flipped ? 'RETURN_TO_VISUAL' : 'ACCESS_LYRIC_CORE'}
        </p>
        <div className="h-[1px] w-0 group-hover:w-full bg-red-600 transition-all duration-300 mt-1" />
      </button>
    </div>
  );
};

export default LyricsFlipCard;