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
  const fetchedFor = useRef('');

  // ── Fetch from LRCLIB ───────────────────────────────────────────────────────
  const fetchLyrics = useCallback(async () => {
    const key = `${song.title}::${song.author}`;
    if (fetchedFor.current === key) return;
    fetchedFor.current = key;
    setLyricsState('loading');
    setSyncedLines([]);
    setPlainLyrics('');
    setActiveLine(0);

    try {
      const params = new URLSearchParams({
        track_name: song.title,
        artist_name: song.author ?? '',
      });
      const res = await fetch(`https://lrclib.net/api/get?${params}`);

      if (!res.ok) { setLyricsState('none'); return; }

      const data = await res.json();

      if (data.syncedLyrics) {
        setSyncedLines(parseLrc(data.syncedLyrics));
        setLyricsState('synced');
      } else if (data.plainLyrics) {
        setPlainLyrics(data.plainLyrics);
        setLyricsState('plain');
      } else {
        setLyricsState('none');
      }
    } catch {
      setLyricsState('none');
    }
  }, [song.title, song.author]);

  // fetch on first flip
  useEffect(() => {
    if (flipped && lyricsState === 'idle') fetchLyrics();
  }, [flipped, lyricsState, fetchLyrics]);

  // reset on song change
  useEffect(() => {
    fetchedFor.current = '';
    setLyricsState('idle');
    setSyncedLines([]);
    setPlainLyrics('');
    setActiveLine(0);
    setFlipped(false);
  }, [song.id]);

  // sync active line
  useEffect(() => {
    if (lyricsState !== 'synced' || !syncedLines.length) return;
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
      if (position >= syncedLines[i].time) idx = i;
      else break;
    }
    setActiveLine(idx);
  }, [position, syncedLines, lyricsState]);

  // auto-scroll active line
  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  // ── Lyrics content ──────────────────────────────────────────────────────────
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
        <div className="overflow-y-auto h-full px-2 py-4 space-y-1">
          {plainLyrics.split('\n').map((line, i) => (
            <p key={i} className="text-neutral-300 text-sm leading-relaxed">
              {line || <br />}
            </p>
          ))}
        </div>
      );
    }
    return (
      <div className="overflow-y-auto h-full px-2 py-4 space-y-3">
        {syncedLines.map((line, i) => (
          <p
            key={i}
            ref={i === activeLine ? activeLineRef : null}
            className={`text-sm leading-relaxed transition-all duration-300 ${
              i === activeLine
                ? 'text-white font-bold text-base'
                : Math.abs(i - activeLine) === 1
                ? 'text-neutral-400'
                : 'text-neutral-600'
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-y-2">
      {/* Flip card */}
      <div
        className="w-64 h-64 cursor-pointer"
        style={{ perspective: '1000px' }}
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
            className="absolute inset-0 rounded-2xl bg-neutral-800 shadow-2xl p-3 overflow-hidden"
          >
            {renderLyricsContent()}
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-neutral-600 text-[10px]">
        {flipped ? 'Toca para ver a capa' : 'Toca na capa para ver a letra'}
      </p>
    </div>
  );
};

export default LyricsFlipCard;