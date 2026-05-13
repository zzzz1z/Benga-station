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

// Strip featured artists, parentheses, etc. for better matching
function cleanTitle(title: string): string {
  return title
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/\[feat\..*?\]/gi, '')
    .replace(/\(with.*?\)/gi, '')
    .replace(/\(.*?remix.*?\)/gi, '')
    .replace(/\(.*?version.*?\)/gi, '')
    .trim();
}

function cleanArtist(artist: string): string {
  return artist.split(/[,&]/)[0].trim();
}

const SYNC_OFFSET = 0.5; // seconds — lyrics are often slightly ahead

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
  const fetchedFor = useRef('');

  const applyResult = (data: { syncedLyrics?: string; plainLyrics?: string }) => {
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

  const fetchLyrics = useCallback(async () => {
    const key = `${song.title}::${song.author}`;
    if (fetchedFor.current === key) return;
    fetchedFor.current = key;
    setLyricsState('loading');
    setSyncedLines([]);
    setPlainLyrics('');
    setActiveLine(0);

    const title = song.title ?? '';
    const artist = song.author ?? '';
    const cleanedTitle = cleanTitle(title);
    const cleanedArtist = cleanArtist(artist);

    try {
      // Attempt 1: exact get with original title/artist
      const p1 = new URLSearchParams({ track_name: title, artist_name: artist });
      const r1 = await fetch(`https://lrclib.net/api/get?${p1}`);
      if (r1.ok) {
        const d1 = await r1.json();
        if (d1.syncedLyrics || d1.plainLyrics) { applyResult(d1); return; }
      }

      // Attempt 2: cleaned title + cleaned artist via search
      const p2 = new URLSearchParams({ track_name: cleanedTitle, artist_name: cleanedArtist });
      const r2 = await fetch(`https://lrclib.net/api/search?${p2}`);
      if (r2.ok) {
        const results = await r2.json();
        if (Array.isArray(results) && results.length > 0) {
          // prefer synced, fallback to plain
          const synced = results.find((r: any) => r.syncedLyrics);
          const plain = results.find((r: any) => r.plainLyrics);
          const best = synced ?? plain;
          if (best) { applyResult(best); return; }
        }
      }

      // Attempt 3: title only search (no artist)
      const p3 = new URLSearchParams({ track_name: cleanedTitle });
      const r3 = await fetch(`https://lrclib.net/api/search?${p3}`);
      if (r3.ok) {
        const results = await r3.json();
        if (Array.isArray(results) && results.length > 0) {
          const synced = results.find((r: any) => r.syncedLyrics);
          const plain = results.find((r: any) => r.plainLyrics);
          const best = synced ?? plain;
          if (best) { applyResult(best); return; }
        }
      }

      setLyricsState('none');
    } catch {
      setLyricsState('none');
    }
  }, [song.title, song.author]);

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

  // sync active line with offset correction
  useEffect(() => {
    if (lyricsState !== 'synced' || !syncedLines.length) return;
    const adjustedPosition = position + SYNC_OFFSET;
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
      if (adjustedPosition >= syncedLines[i].time) idx = i;
      else break;
    }
    setActiveLine(idx);
  }, [position, syncedLines, lyricsState]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  const renderLyricsContent = () => {
    if (lyricsState === 'loading') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      );
    }
    if (lyricsState === 'none') {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-neutral-500 text-sm">Sem letra disponível</p>
        </div>
      );
    }
    if (lyricsState === 'plain') {
      return (
        <div className="overflow-y-auto h-full px-3 py-4 space-y-1">
          {plainLyrics.split('\n').map((line, i) => (
            <p key={i} className="text-neutral-300 text-sm leading-relaxed">
              {line || <br />}
            </p>
          ))}
        </div>
      );
    }
    return (
      <div className="overflow-y-auto h-full px-3 py-4 space-y-3">
        {syncedLines.map((line, i) => (
          <p
            key={i}
            ref={i === activeLine ? activeLineRef : null}
            className={`leading-relaxed transition-all duration-300 ${
              i === activeLine
                ? 'text-white font-bold text-base'
                : Math.abs(i - activeLine) === 1
                ? 'text-neutral-400 text-sm'
                : 'text-neutral-600 text-sm'
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-y-2 w-full">
      <div
        className="w-full cursor-pointer"
        style={{
          perspective: '1000px',
          height: flipped ? '380px' : '256px',
          transition: 'height 0.5s ease',
          maxWidth: flipped ? '100%' : '256px',
        } as React.CSSProperties}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front — album art */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              fill
              src={imageUrl ?? '/images/likedit.png'}
              alt={song.title}
              className="object-cover"
              sizes="256px"
              unoptimized
              priority
            />
          </div>

          {/* Back — lyrics */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 rounded-2xl bg-neutral-800 shadow-2xl overflow-hidden"
          >
            {renderLyricsContent()}
          </div>
        </div>
      </div>

      <p className="text-neutral-600 text-[10px]">
        {flipped ? 'Toca para ver a capa' : 'Toca na capa para ver a letra'}
      </p>
    </div>
  );
};

export default LyricsFlipCard;