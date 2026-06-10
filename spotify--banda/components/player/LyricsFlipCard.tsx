'use client';

import { Song } from "@/types";
import useLoadImage from "@/hooks/useLoadImage";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import { IoChevronDown } from "react-icons/io5";

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

interface CachedLyrics {
  state: LyricsState;
  syncedLines: LrcLine[];
  plainLyrics: string;
}

const lyricsSessionCache = new Map<string, CachedLyrics>();

interface LyricsFlipCardProps {
  song: Song;
  position: number;
  duration: number;
  isPlaying?: boolean;
}

const NOISE_RE = /\b(official\s*(music\s*)?video|official\s*audio|official\s*lyric\s*video|lyric\s*video|lyrics?|audio|video|vevo|topic|hd|hq|4k|live|performance|visualizer|explicit|clean|remix|remaster(?:ed)?|feat\.?|ft\.?|prod\.?(\s*by)?)\b|\(.*?\)|\[.*?\]/gi;

function cleanTitle(raw: string): string {
  return raw.replace(NOISE_RE, ' ').replace(/\s{2,}/g, ' ').trim();
}

function buildCandidates(rawTitle: string, rawChannel: string) {
  const channel = cleanTitle(rawChannel.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim());
  const fullCleaned = cleanTitle(rawTitle);
  const dashIdx = fullCleaned.indexOf(' - ');
  const left = dashIdx !== -1 ? fullCleaned.slice(0, dashIdx).trim() : '';
  const right = dashIdx !== -1 ? fullCleaned.slice(dashIdx + 3).trim() : '';

  const candidates: { artist: string; track: string }[] = [];
  if (left && right) {
    candidates.push({ artist: left, track: right });
    candidates.push({ artist: right, track: left });
    candidates.push({ artist: channel, track: right });
    candidates.push({ artist: channel, track: left });
    candidates.push({ artist: channel, track: fullCleaned });
  } else {
    candidates.push({ artist: channel, track: fullCleaned });
    candidates.push({ artist: '', track: fullCleaned });
  }
  candidates.push({ artist: '', track: right || fullCleaned });

  const seen = new Set<string>();
  return candidates.filter(c => {
    const key = `${c.artist}||${c.track}`;
    if (seen.has(key) || !c.track) return false;
    seen.add(key);
    return true;
  });
}

async function queryLrclib(artist: string, track: string): Promise<any | null> {
  try {
    const params = new URLSearchParams({ track_name: track });
    if (artist) params.set('artist_name', artist);
    const res = await fetch(`https://lrclib.net/api/get?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics || data.plainLyrics) return data;
    }
  } catch (_) {}
  try {
    const q = artist ? `${artist} ${track}` : track;
    const res = await fetch(`https://lrclib.net/api/search?${new URLSearchParams({ q })}`);
    if (res.ok) {
      const results = await res.json();
      if (results?.length > 0)
        return results.find((r: any) => r.syncedLyrics) || results.find((r: any) => r.plainLyrics) || null;
    }
  } catch (_) {}
  return null;
}

// ── Fullscreen lyrics overlay ──────────────────────────────────────────────────

const FullscreenLyrics: React.FC<{
  lines: LrcLine[];
  activeLine: number;
  onClose: () => void;
  isPlaying: boolean;
}> = ({ lines, activeLine, onClose, isPlaying }) => {
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  return (
<div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#020202', paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 3px)' }} />

      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.06) 0%, transparent 70%)',
            animation: 'beatPulse 1.2s ease-in-out infinite',
          }} />
      )}

      {/* header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <p className="text-neutral-600 font-mono text-[9px] uppercase tracking-[0.3em]">Letra completa</p>
        <button
          onClick={onClose}
          className="text-neutral-400 p-3 -mr-2 flex items-center gap-x-2"
        >
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">fechar</span>
          <IoChevronDown size={22} />
        </button>
      </div>

      {/* lyrics */}
      <div className="flex-1 overflow-y-auto px-8 py-12 space-y-8">
        {lines.map((line, i) => {
          const isActive = i === activeLine;
          const isPast   = i < activeLine;
          return (
            <div key={i} className="relative" ref={isActive ? (activeLineRef as any) : null}>
              <p className={`leading-snug uppercase tracking-tight  duration-700 ${
                isActive
                  ? 'text-white font-black text-3xl'
                  : isPast
                  ? 'text-neutral-700 font-bold text-xl'
                  : 'text-neutral-800 font-bold text-xl'
              }`}>
                {line.text}
              </p>
              {/* red underline sweep */}
              {isActive && (
                <span className="absolute bottom-[-6px] left-0 h-[2px] bg-red-500 rounded-full"
                  style={{
                    width: '100%',
                    boxShadow: '0 0 8px #ef4444',
                    animation: 'underlineSweep 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
                  }} />
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes underlineSweep {
          from { width: 0%; opacity: 0; }
          to   { width: 100%; opacity: 1; }
        }
        @keyframes beatPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const LyricsFlipCard: React.FC<LyricsFlipCardProps> = ({ song, position, duration, isPlaying = false }) => {
  const imageUrl   = useLoadImage(song);
  const songCacheKey = String(song.id);
  const fromCache    = lyricsSessionCache.get(songCacheKey);

  // 0 = art, 1 = lyrics card, 2 = fullscreen
  const [tapState, setTapState]     = useState<0 | 1 | 2>(0);
  const [lyricsState, setLyricsState] = useState<LyricsState>(fromCache?.state ?? 'idle');
  const [syncedLines, setSyncedLines] = useState<LrcLine[]>(fromCache?.syncedLines ?? []);
  const [plainLyrics, setPlainLyrics] = useState(fromCache?.plainLyrics ?? '');

  // raw active line (instant)
  const [rawActiveLine, setRawActiveLine] = useState(0);
  // debounced active line (300ms delay)
  const [activeLine, setActiveLine]       = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeLineRef      = useRef<HTMLParagraphElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const retryTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidatesRef      = useRef<{ artist: string; track: string }[]>([]);
  const candidateIndexRef  = useRef(0);
  const isFetchingRef      = useRef(false);
  const abortedRef         = useRef(false);

  const saveToCache = useCallback((state: LyricsState, synced: LrcLine[], plain: string) => {
    lyricsSessionCache.set(songCacheKey, { state, syncedLines: synced, plainLyrics: plain });
  }, [songCacheKey]);

  const clearRetry = useCallback(() => {
    abortedRef.current = true;
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
  }, []);

  const processLyricsData = useCallback((data: any) => {
    if (data?.syncedLyrics) {
      const lines = parseLrc(data.syncedLyrics);
      setSyncedLines(lines);
      setLyricsState('synced');
      saveToCache('synced', lines, '');
    } else if (data?.plainLyrics) {
      setPlainLyrics(data.plainLyrics);
      setLyricsState('plain');
      saveToCache('plain', [], data.plainLyrics);
    } else {
      setLyricsState('none');
      saveToCache('none', [], '');
    }
  }, [saveToCache]);

  const tryNextCandidate = useCallback(async () => {
    if (isFetchingRef.current || abortedRef.current) return;
    if (duration > 0 && position >= duration * 0.85) {
      clearRetry();
      setLyricsState('none');
      saveToCache('none', [], '');
      return;
    }
    const candidates = candidatesRef.current;
    const idx = candidateIndexRef.current;
    if (idx >= candidates.length) {
      candidateIndexRef.current = 0;
      retryTimerRef.current = setTimeout(tryNextCandidate, 2000);
      return;
    }
    isFetchingRef.current = true;
    const { artist, track } = candidates[idx];
    candidateIndexRef.current = idx + 1;
    try {
      const data = await queryLrclib(artist, track);
      if (abortedRef.current) return;
      if (data) { clearRetry(); processLyricsData(data); }
      else { isFetchingRef.current = false; tryNextCandidate(); }
    } catch (_) {
      isFetchingRef.current = false;
      if (!abortedRef.current) tryNextCandidate();
    }
    isFetchingRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, position, processLyricsData, clearRetry, saveToCache]);

  const startFetch = useCallback(async () => {
    const cached = lyricsSessionCache.get(songCacheKey);
    if (cached && cached.state !== 'idle') {
      setLyricsState(cached.state);
      setSyncedLines(cached.syncedLines);
      setPlainLyrics(cached.plainLyrics);
      return;
    }
    abortedRef.current    = false;
    isFetchingRef.current = false;
    candidateIndexRef.current = 0;
    setLyricsState('loading');
    setSyncedLines([]);
    setPlainLyrics('');
    setRawActiveLine(0);
    setActiveLine(0);

    if (song.source === 'youtube' && song.youtube_video_id) {
      try {
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lyrics?videoId=${song.youtube_video_id}`);
        if (abortedRef.current) return;
        if (res.ok) {
          const data = await res.json();
          if (data.found !== false) { processLyricsData(data); return; }
        }
      } catch (_) {}
      if (abortedRef.current) return;
      candidatesRef.current = buildCandidates(song.title, song.author ?? '');
      tryNextCandidate();
    } else {
      candidatesRef.current = buildCandidates(song.title, song.author ?? '');
      tryNextCandidate();
    }
  }, [song, songCacheKey, processLyricsData, tryNextCandidate]);

  useEffect(() => {
    startFetch();
    return () => { clearRetry(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lyricsState !== 'loading' && lyricsState !== 'idle') return;
    if (duration > 0 && position >= duration * 0.85) {
      clearRetry();
      setLyricsState('none');
      saveToCache('none', [], '');
    }
  }, [position, duration, lyricsState, clearRetry, saveToCache]);

  // Active line tracking with debounce
  useEffect(() => {
    if (lyricsState !== 'synced' || !syncedLines.length) return;
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
      if (position >= syncedLines[i].time) idx = i;
      else break;
    }
    if (idx === rawActiveLine) return;
    setRawActiveLine(idx);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setActiveLine(idx), 300);
  }, [position, syncedLines, lyricsState, rawActiveLine]);

  // Auto-scroll in card
  useEffect(() => {
    if (tapState === 1 && lyricsState === 'synced')
      activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine, tapState, lyricsState]);

  const handleTap = () => {
    if (tapState === 0) { setTapState(1); return; }
    if (tapState === 1 && lyricsState === 'synced') { setTapState(2); return; }
    if (tapState === 1) { setTapState(0); return; }
  };

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
        <div className="relative h-full">
          {/* fade top */}
          <div className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, #050505, transparent)' }} />
          {/* fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #050505, transparent)' }} />
          <div className="overflow-y-auto h-full px-6 py-8">
            {plainLyrics.split('\n').map((line, i) => (
              <p key={i} className="text-neutral-300 font-mono text-sm leading-relaxed mb-1.5 uppercase tracking-wide">
                {line || <br />}
              </p>
            ))}
          </div>
        </div>
      );
    }
    // synced
    return (
      <div className="relative h-full">
        {/* fade top */}
        <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #050505, transparent)' }} />
        {/* fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #050505, transparent)' }} />
        <div ref={scrollContainerRef} className="overflow-y-auto h-full px-6 py-20 space-y-7">
          {syncedLines.map((line, i) => {
            const isActive = i === activeLine;
            const isPast   = i < activeLine;
            return (
              <div key={i} className="relative">
                <p
                  ref={isActive ? activeLineRef : null}
                  className={`leading-snug  duration-700 uppercase tracking-tight ${
                    isActive
                      ? 'text-white text-2xl font-black'
                      : isPast
                      ? 'text-neutral-700 text-lg font-bold'
                      : 'text-neutral-600 text-lg font-bold'
                  }`}
                >
                  {line.text}
                </p>
                {isActive && (
                  <span
                    className="absolute bottom-[-5px] left-0 h-[2px] bg-red-500 rounded-full"
                    style={{
                      boxShadow: '0 0 6px #ef4444',
                      animation: 'underlineSweep 0.45s cubic-bezier(0.4,0,0.2,1) forwards',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const flipped = tapState >= 1;

  return (
    <>
      {/* fullscreen overlay */}
      {tapState === 2 && lyricsState === 'synced' && (
        <FullscreenLyrics
          lines={syncedLines}
          activeLine={activeLine}
          isPlaying={isPlaying}
          onClose={() => setTapState(1)}
        />
      )}

      <div className="flex flex-col items-center gap-y-3 w-full">
        <div
          className="w-full relative cursor-pointer"
          style={{
            perspective: '1200px',
            height: flipped ? '380px' : '280px',
            maxWidth: flipped ? '100%' : '280px',
            transition: 'height 0.5s cubic-bezier(0.23,1,0.32,1), max-width 0.5s cubic-bezier(0.23,1,0.32,1)',
          }}
          onClick={handleTap}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front — album art */}
            <div
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              className="absolute inset-0 border border-red-900/20 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
              <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
                className="object-cover  duration-700"
                sizes="280px" unoptimized priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                lyricsState === 'synced' || lyricsState === 'plain' ? 'bg-green-500' :
                lyricsState === 'none' ? 'bg-red-600' : 'bg-amber-400 animate-pulse'
              }`} />
            </div>

            {/* Back — lyrics */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden' as any,
                transform: 'rotateY(180deg)',
                background: isPlaying ? 'linear-gradient(180deg, #050505 0%, #080505 100%)' : '#050505',
                animation: isPlaying ? 'cardBeatPulse 1.4s ease-in-out infinite' : undefined,
              }}
              className="absolute inset-0 border border-red-600/20 overflow-hidden"
            >
              <div className="absolute top-2 left-2 font-mono text-[8px] text-red-600/20 uppercase select-none">LYRIC_STREAM</div>
              {lyricsState === 'synced' && (
                <div className="absolute top-2 right-2 font-mono text-[8px] text-red-600/30 uppercase select-none">
                  ↑ fullscreen
                </div>
              )}
              {renderLyricsContent()}
            </div>
          </div>
        </div>

        {/* hint label */}
        <button onClick={handleTap} className="group flex flex-col items-center">
          <p className="text-red-600/40 font-mono text-[9px] uppercase tracking-[0.3em]">
            {tapState === 0
              ? 'ACCESS_LYRIC_CORE'
              : tapState === 1 && lyricsState === 'synced'
              ? 'TAP_FOR_FULLSCREEN'
              : 'RETURN_TO_VISUAL'}
          </p>
          <div className="h-[1px] w-8 bg-red-600/20 mt-1" />
        </button>
      </div>

      <style>{`
        @keyframes underlineSweep {
          from { width: 0%; opacity: 0; }
          to   { width: 100%; opacity: 1; }
        }
        @keyframes cardBeatPulse {
          0%, 100% { background: linear-gradient(180deg, #050505 0%, #080505 100%); }
          50%       { background: linear-gradient(180deg, #0a0404 0%, #0d0505 100%); }
        }
        @keyframes beatPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LyricsFlipCard;