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
}

const LyricsFlipCard: React.FC<LyricsFlipCardProps> = ({ song, position }) => {
  const imageUrl = useLoadImage(song);

  const [flipped, setFlipped] = useState(false);
  const [lyricsState, setLyricsState] = useState<LyricsState>('idle');
  const [syncedLines, setSyncedLines] = useState<LrcLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState('');
  const [activeLine, setActiveLine] = useState(0);

  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fetchedFor = useRef('');

  const fetchLyrics = useCallback(async () => {
    const cleanName = (name: string) => {
      return name
        .replace(/(VEVO|Official|Topic|Video|Audio|Lyrics|Lyric Video)/gi, '')
        .replace(/[-()[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const track = cleanName(song.title);
    const artist = cleanName(song.author || '');

    const key = `${track}::${artist}`;
    if (fetchedFor.current === key) return;
    fetchedFor.current = key;

    setLyricsState('loading');

    try {
      // ── Attempt 1: title only (no artist) ──────────────────────────────────
      // Many YouTube titles already include "Artist - Track", so sending the
      // author field as well doubles up and confuses the API.
      const attempt1 = await fetch(
        `https://lrclib.net/api/get?${new URLSearchParams({ track_name: track, artist_name: '' })}`
      );

      if (attempt1.ok) {
        const data = await attempt1.json();
        if (data.syncedLyrics || data.plainLyrics) {
          processLyricsData(data);
          return;
        }
      }

      // ── Attempt 2: title + author field ────────────────────────────────────
      if (artist) {
        const attempt2 = await fetch(
          `https://lrclib.net/api/get?${new URLSearchParams({ track_name: track, artist_name: artist })}`
        );

        if (attempt2.ok) {
          const data = await attempt2.json();
          if (data.syncedLyrics || data.plainLyrics) {
            processLyricsData(data);
            return;
          }
        }
      }

      // ── Attempt 3: search with title only ──────────────────────────────────
      const search1 = await fetch(
        `https://lrclib.net/api/search?${new URLSearchParams({ q: track })}`
      );
      if (search1.ok) {
        const results = await search1.json();
        if (results?.length > 0) {
          const best = results.find((s: any) => s.syncedLyrics)
            || results.find((s: any) => s.plainLyrics)
            || results[0];
          processLyricsData(best);
          return;
        }
      }

      // ── Attempt 4: search with title + artist ──────────────────────────────
      if (artist) {
        const search2 = await fetch(
          `https://lrclib.net/api/search?${new URLSearchParams({ q: `${track} ${artist}` })}`
        );
        if (search2.ok) {
          const results = await search2.json();
          if (results?.length > 0) {
            const best = results.find((s: any) => s.syncedLyrics)
              || results.find((s: any) => s.plainLyrics)
              || results[0];
            processLyricsData(best);
            return;
          }
        }
      }

      throw new Error('No results');
    } catch (err) {
      console.error("Lyrics fetch error:", err);
      setLyricsState('none');
    }
  }, [song.title, song.author]);

  const processLyricsData = (data: any) => {
    if (data.syncedLyrics) {
      setSyncedLines(parseLrc(data.syncedLyrics));
      setLyricsState('synced');
    } else if (data.plainLyrics) {
      setPlainLyrics(data.plainLyrics);
      setLyricsState('plain');
    } else {
      setLyricsState('none');
    }
  };

  useEffect(() => {
    if (flipped && lyricsState === 'idle') fetchLyrics();
  }, [flipped, lyricsState, fetchLyrics]);

  useEffect(() => {
    fetchedFor.current = '';
    setLyricsState('idle');
    setSyncedLines([]);
    setPlainLyrics('');
    setActiveLine(0);
    setFlipped(false);
  }, [song.id]);

  useEffect(() => {
    if (lyricsState !== 'synced' || !syncedLines.length) return;
    const currentTime = position;    
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
      if (currentTime >= syncedLines[i].time) idx = i;
      else break;
    }
    setActiveLine(idx);
  }, [position, syncedLines, lyricsState]);

  useEffect(() => {
    if (flipped && lyricsState === 'synced') {
      activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine, flipped, lyricsState]);

  const renderLyricsContent = () => {
    if (lyricsState === 'loading') {
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
            Error_404<br/>Signal_Lost<br/>No_Lyrics_Found
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
          </div>

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
        onClick={() => setFlipped(!flipped)}
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