'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOfflineStorage, OfflineSong } from '@/hooks/useOfflineStorage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MdWifiOff, MdDelete, MdPlayArrow, MdStorage } from 'react-icons/md';
import { HiOutlineSignalSlash } from 'react-icons/hi2';
import { BiSearch } from 'react-icons/bi';
import toast from 'react-hot-toast';
import usePlayer from '@/hooks/usePlayer';
import Header from '@/components/Header';

// ── helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Converts an OfflineSong into the minimal Song shape usePlayer expects
const offlineToSong = (s: OfflineSong) => ({
  id: `offline_${s.videoId}`,
  user_id: '',
  author: s.author,
  title: s.title,
  song_path: '',
  image_path: s.thumbnail,
  source: 'youtube' as const,
  youtube_video_id: s.videoId,
});

// ── component ─────────────────────────────────────────────────────────────────

export default function OfflinePage() {
  const router = useRouter();
  const {
    isNative,
    getAllOfflineSongs,
    removeOffline,
    getTotalSize,
    offlineSongs,
  } = useOfflineStorage();

  const setQueue = usePlayer(s => s.setQueue);

  const [songs, setSongList] = useState<OfflineSong[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Refresh list whenever offlineSongs changes
  useEffect(() => {
    setSongList(getAllOfflineSongs());
  }, [offlineSongs, getAllOfflineSongs]);

  const handlePlay = useCallback((song: OfflineSong) => {
    const allSongs = getAllOfflineSongs().map(offlineToSong);
    const startId = `offline_${song.videoId}`;
    setQueue(allSongs, startId);
  }, [getAllOfflineSongs, setQueue]);

  const handleRemove = useCallback(async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoving(videoId);
    try {
      await removeOffline(videoId);
      toast.success('Removido do offline');
    } catch {
      toast.error('Erro ao remover');
    } finally {
      setRemoving(null);
    }
  }, [removeOffline]);

  const totalSize = getTotalSize();

  const filteredSongs = query.trim()
    ? songs.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.author.toLowerCase().includes(query.toLowerCase())
      )
    : songs;

  // ── not native ──────────────────────────────────────────────────────────────
  if (!isNative) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-y-4 bg-neutral-900 text-center px-8">
        <HiOutlineSignalSlash size={48} className="text-red-600/50" />
        <p className="text-neutral-400 text-sm font-medium">
          O modo offline só está disponível na app nativa.
        </p>
        <button
          onClick={() => router.back()}
          className="text-xs text-red-500 uppercase tracking-widest hover:text-red-400 transition"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  // ── empty state ─────────────────────────────────────────────────────────────
  if (songs.length === 0) {
    return (
      <div className="h-full flex flex-col bg-neutral-900 pt-[65px]">
        {/* Header */}
        <OfflineHeader isOnline={isOnline} totalSize={0} songCount={0} />

        <div className="flex flex-col items-center justify-center flex-1 gap-y-5 px-8 text-center pb-24">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl rounded-full bg-red-600/10" />
            <MdWifiOff size={64} className="relative text-red-900/60" />
          </div>
          <div>
            <p className="text-white font-black text-lg uppercase tracking-widest">
              Sem músicas offline
            </p>
            <p className="text-neutral-500 text-xs mt-2 leading-relaxed max-w-xs">
              Guarda músicas para ouvires sem internet. Toca no ícone{' '}
              <span className="text-red-500">⬇</span> em qualquer música.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-2 px-6 py-2 text-xs font-black uppercase tracking-widest text-red-500 border border-red-900/40 hover:bg-red-600/10 transition"
            style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
          >
            Explorar biblioteca
          </button>
        </div>
      </div>
    );
  }

  // ── main list ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-neutral-900 pt-[65px] overflow-hidden">
      {/* Header */}
      <OfflineHeader isOnline={isOnline} totalSize={totalSize} songCount={songs.length} />

      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-x-2 bg-neutral-800 border border-white/5 px-3 py-2"
          style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}>
          <BiSearch size={14} className="text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar offline..."
            className="bg-transparent text-white text-xs placeholder:text-neutral-600 outline-none flex-1 font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-600 hover:text-white text-xs transition">✕</button>
          )}
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto pb-28 px-4">
        {/* Play all — only when not searching */}
        {!query && songs.length > 0 && (
          <button
            onClick={() => handlePlay(songs[0])}
            className="w-full flex items-center justify-center gap-x-2 py-3 mb-4
              text-xs font-black uppercase tracking-widest text-black bg-red-600
              hover:bg-red-500 active:scale-95 transition-all"
            style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
          >
            <MdPlayArrow size={18} />
            Reproduzir tudo ({songs.length})
          </button>
        )}

        <ul className="flex flex-col gap-y-1">
          {filteredSongs.length === 0 && query ? (
            <li className="text-center py-10 text-neutral-600 text-xs font-mono uppercase tracking-widest">
              Sem resultados para "{query}"
            </li>
          ) : (
            filteredSongs.map((song) => (
              <OfflineRow
                key={song.videoId}
                song={song}
                isRemoving={removing === song.videoId}
                onPlay={() => handlePlay(song)}
                onRemove={(e) => handleRemove(song.videoId, e)}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

const GAMER_CUT = 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)';

function OfflineHeader({
  isOnline,
  totalSize,
  songCount,
}: {
  isOnline: boolean;
  totalSize: number;
  songCount: number;
}) {
  return ( 
    <>
      <Header>
       <></>
      </Header>
     <div className="relative px-6 pt-4 pb-5 border-b border-white/5 flex-shrink-0">

     
      {/* Scanline */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.015) 3px, rgba(239,68,68,0.015) 4px)',
        }}
      />
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)' }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-x-2 mb-1">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-red-400"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                clipPath: GAMER_CUT,
              }}
            >
              Modo Offline
            </span>
            <span
              className={`flex items-center gap-x-1 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 ${
                isOnline
                  ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-500/30'
                  : 'text-red-400 bg-red-400/10 border border-red-500/30'
              }`}
              style={{ clipPath: GAMER_CUT }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}
              />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <h1
            className="text-white text-3xl font-black uppercase tracking-tighter leading-none"
            style={{ textShadow: '0 0 20px rgba(239,68,68,0.25)' }}
          >
            Biblioteca Offline
          </h1>
        </div>

        {songCount > 0 && (
          <div className="flex flex-col items-end gap-y-1 mt-1">
            <div className="flex items-center gap-x-1.5 text-neutral-500">
              <MdStorage size={12} />
              <span className="text-[10px] font-mono">{formatBytes(totalSize)}</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-600">{songCount} músicas</span>
          </div>
        )}
      </div>
    </div>
    
    </>
  

   
  );
}

function OfflineRow({
  song,
  isRemoving,
  onPlay,
  onRemove,
}: {
  song: OfflineSong;
  isRemoving: boolean;
  onPlay: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  return (
    <li
      onClick={onPlay}
      className="flex items-center gap-x-3 p-2 cursor-pointer
        hover:bg-red-600/5 border border-transparent hover:border-red-900/30
        active:scale-[0.99] transition-all group"
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden border border-white/5">
        {song.thumbnail ? (
          <Image
            fill
            src={song.thumbnail}
            alt={song.title}
            sizes="48px"
            className="object-cover grayscale-[0.4] group-hover:grayscale-0 transition duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <MdWifiOff size={16} className="text-neutral-600" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <MdPlayArrow size={22} className="text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-white text-sm font-bold truncate group-hover:text-red-400 transition">
          {song.title}
        </p>
        <p className="text-neutral-500 text-[10px] truncate">{song.author}</p>
        <div className="flex items-center gap-x-2 mt-0.5">
          <span className="text-[9px] font-mono text-red-900/70">{formatBytes(song.sizeBytes)}</span>
          <span className="text-[9px] text-neutral-700">·</span>
          <span className="text-[9px] font-mono text-neutral-700">{formatDate(song.savedAt)}</span>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={isRemoving}
        className="flex-shrink-0 p-2 text-neutral-600 hover:text-red-500 active:scale-90 transition"
        title="Remover offline"
      >
        {isRemoving ? (
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <MdDelete size={18} />
        )}
      </button>
    </li>
  );
}