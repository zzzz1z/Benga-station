'use client';

import { useState, useCallback } from 'react';
import MediaItem from '@/components/MediaItem';
import useOnPlay from '@/hooks/useOnPlay';
import { Song } from '@/types';

interface SearchContentProps {
  songs: Song[];
  hasMore: boolean;
  query: string;
}

const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const LuandaSkeleton = ({ index }: { index: number }) => {
  const delays = ['0ms', '120ms', '240ms'];
  const goldFlicker = index % 3 === 0;

  return (
    <div
      className="relative flex items-center gap-x-3 px-2 py-2 overflow-hidden"
      style={{ animationDelay: delays[index % 3] }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,180,0,0.03) 2px, rgba(255,180,0,0.03) 3px)',
          animation: 'luanda-scan 1.8s ease-in-out infinite',
          animationDelay: delays[index % 3],
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,180,0,0.06) 50%, transparent 100%)',
          animation: 'luanda-sweep 2.2s ease-in-out infinite',
          animationDelay: delays[index % 3],
        }}
      />
      <div
        className="w-10 h-10 flex-shrink-0 relative overflow-hidden"
        style={{
          background: goldFlicker
            ? 'linear-gradient(135deg, #1a0a00, #2d1500, #1a0a00)'
            : 'linear-gradient(135deg, #0d0d0d, #1a1a1a, #0d0d0d)',
          border: goldFlicker ? '1px solid rgba(255,160,0,0.3)' : '1px solid rgba(239,68,68,0.2)',
          clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,180,0,0.15), transparent)',
            animation: 'luanda-shimmer 1.6s ease-in-out infinite',
            animationDelay: delays[index % 3],
          }}
        />
      </div>
      <div className="flex flex-col gap-y-1.5 flex-1">
        <div
          className="h-2.5 rounded-none relative overflow-hidden"
          style={{
            width: `${55 + (index * 13) % 30}%`,
            background: goldFlicker ? 'rgba(255,140,0,0.12)' : 'rgba(239,68,68,0.1)',
            border: goldFlicker ? '1px solid rgba(255,140,0,0.2)' : '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              animation: 'luanda-shimmer 1.6s ease-in-out infinite',
              animationDelay: delays[index % 3],
            }}
          />
        </div>
        <div
          className="h-2 rounded-none relative overflow-hidden"
          style={{
            width: `${30 + (index * 7) % 20}%`,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              animation: 'luanda-shimmer 1.6s ease-in-out infinite',
              animationDelay: `${parseInt(delays[index % 3]) + 200}ms`,
            }}
          />
        </div>
      </div>
      <div
        className="w-1.5 h-1.5 flex-shrink-0 rounded-full"
        style={{
          background: goldFlicker ? 'rgba(255,140,0,0.4)' : 'rgba(239,68,68,0.3)',
          animation: 'luanda-pulse 1.4s ease-in-out infinite',
          animationDelay: delays[index % 3],
        }}
      />
    </div>
  );
};

const SearchContent: React.FC<SearchContentProps> = ({ songs: initialSongs, hasMore: initialHasMore, query }) => {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const onPlay = useOnPlay(songs);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) params.set('title', query);

      const res = await fetch(`/api/songs?${params}`);
      const data = await res.json();

      setSongs(prev => [...prev, ...data.songs]);
      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, query]);

  if (songs.length === 0 && !loading)
    return (
      <div className="flex flex-col gap-y-3 w-full px-6 py-8">
        <div className="flex items-center gap-x-3">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,140,0,0.4), transparent)' }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,140,0,0.6)' }}>
            SEM RESULTADO
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,140,0,0.4))' }} />
        </div>
        <p className="text-neutral-600 font-mono text-xs uppercase tracking-widest px-1">
          {">"} ERR: Nenhuma música encontrada para &quot;{query}&quot;
        </p>
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes luanda-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes luanda-sweep {
          0%, 100% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; transform: translateX(100%); }
        }
        @keyframes luanda-scan {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes luanda-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes luanda-flicker {
          0%, 90%, 100% { opacity: 1; }
          92% { opacity: 0.4; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          98% { opacity: 1; }
        }
        @keyframes luanda-load-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col w-full px-6 gap-y-1">
        {songs.map((song, i) => (
          <div
            key={song.id}
            className="relative border-b border-white/5 last:border-0"
            style={{
              animation: 'luanda-load-in 0.2s ease-out forwards',
              animationDelay: `${Math.min(i, 8) * 30}ms`,
              opacity: 0,
            }}
          >
            <MediaItem
              onClick={() => onPlay(getSongPlayerId(song))}
              data={song}
            />
          </div>
        ))}

        {loading && (
          <div className="flex flex-col gap-y-0.5 mt-1 relative">
            <div className="flex items-center gap-x-2 px-2 py-1.5 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: '#ffa500',
                  animation: 'luanda-pulse 0.8s ease-in-out infinite',
                  boxShadow: '0 0 6px rgba(255,165,0,0.8)',
                }}
              />
              <span
                className="text-[9px] font-mono uppercase tracking-[0.3em]"
                style={{
                  color: 'rgba(255,165,0,0.8)',
                  animation: 'luanda-flicker 2s ease-in-out infinite',
                }}
              >
                A carregar · Luanda FM
              </span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,165,0,0.3), transparent)' }} />
            </div>
            {[0, 1, 2, 3].map(i => <LuandaSkeleton key={i} index={i} />)}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              onClick={loadMore}
              className="relative group overflow-hidden px-8 py-3 font-mono text-xs uppercase tracking-[0.25em] transition-all"
              style={{
                background: 'linear-gradient(135deg, #0d0500, #1a0a00)',
                border: '1px solid rgba(255,140,0,0.4)',
                color: 'rgba(255,165,0,0.9)',
                clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                boxShadow: '0 0 12px rgba(255,140,0,0.1), inset 0 0 12px rgba(255,140,0,0.03)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.08), rgba(239,68,68,0.05))' }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,140,0,0.02) 2px, rgba(255,140,0,0.02) 3px)',
                }}
              />
              <span className="relative flex items-center gap-x-3">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: '#ffa500',
                    boxShadow: '0 0 4px rgba(255,165,0,0.8)',
                    animation: 'luanda-pulse 1.2s ease-in-out infinite',
                  }}
                />
                Carregar mais
                <span style={{ color: 'rgba(255,140,0,0.5)' }}>// +15</span>
              </span>
            </button>
          </div>
        )}

        {!hasMore && songs.length > 0 && (
          <div className="flex items-center gap-x-3 px-2 py-4">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,140,0,0.2), transparent)' }} />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,140,0,0.35)' }}>
              fim dos resultados
            </span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,140,0,0.2))' }} />
          </div>
        )}
      </div>
    </>
  );
};

export default SearchContent;