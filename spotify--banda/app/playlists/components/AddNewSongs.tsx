'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Song } from '@/types';
import ModalToAddNewSongs from './ModalToAddNewSongs';
import MediaItem from '@/components/MediaItem';
import { CiCirclePlus } from 'react-icons/ci';
import { MdOutlineNotInterested } from 'react-icons/md';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { authedFetch } from '@/utils/api';


interface YTResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface AddNewSongsProps {
  playlistId: string;
  refreshPlaylist: () => void;
  /** If true, hides the trigger button and starts open — for use inside PlaylistModal */
  inlineOpen?: boolean;
}

const SLASH6 = 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)';
const SLASH8 = 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)';

const AddNewSongs: React.FC<AddNewSongsProps> = ({ playlistId, refreshPlaylist, inlineOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'db' | 'yt'>('db');
  const [committing, setCommitting] = useState(false);

  // DB tab
  const [dbResults, setDbResults] = useState<Song[]>([]);
  const [dbSearching, setDbSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [playlistSongs, setPlaylistSongs] = useState<Set<string>>(new Set());
  const [warning, setWarning] = useState<string | null>(null);
  const dbAbortRef = useRef<AbortController | null>(null);

  // YT tab
  const [ytQuery, setYtQuery] = useState('');
  const [ytResults, setYtResults] = useState<YTResult[]>([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [ytReadyIds, setYtReadyIds] = useState<Set<string>>(new Set());
  const [ytUnavailableIds, setYtUnavailableIds] = useState<Set<string>>(new Set());
  const [ytLoadingIds, setYtLoadingIds] = useState<Set<string>>(new Set());
  const [ytSelectedIds, setYtSelectedIds] = useState<Set<string>>(new Set());
  const ytAbortRef = useRef<AbortController | null>(null);

  const totalSelected = selectedSongs.size + ytSelectedIds.size;

  // ── open/close ──────────────────────────────────────────────────────────────
const handleOpen = async () => {
  setIsOpen(true);
  const res = await authedFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/playlist/${playlistId}`
  );
  if (res.ok) {
    const data = await res.json();
    const ids = (data.playlist_songs ?? []).map((i: any) => String(i.Songs?.id)).filter(Boolean);
    setPlaylistSongs(new Set(ids));
  }
};

  const handleClose = () => {
    setIsOpen(false);
    setTab('db');
    setSearchTerm('');
    setDbResults([]);
    setSelectedSongs(new Set());
    setYtQuery('');
    setYtResults([]);
    setYtSelectedIds(new Set());
    setYtReadyIds(new Set());
    setYtUnavailableIds(new Set());
    setYtLoadingIds(new Set());
    setWarning(null);
  };

  // ── DB search ───────────────────────────────────────────────────────────────
const handleDbSearch = useCallback(async (term: string) => {
  setSearchTerm(term);
  if (term.trim().length < 2) { setDbResults([]); return; }
  dbAbortRef.current?.abort();
  dbAbortRef.current = new AbortController();
  setDbSearching(true);
  try {
    const res = await authedFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/songs?search=${encodeURIComponent(term)}&limit=30`
    );
    if (res.ok) {
      const data = await res.json();
      setDbResults(data || []);
    }
  } finally {
    setDbSearching(false);
  }
}, []);

  const handleCheckboxChange = (songId: string) => {
    if (playlistSongs.has(songId)) {
      setWarning('Essa música já se encontra na playlist!');
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    setSelectedSongs(prev => {
      const next = new Set(prev);
      next.has(songId) ? next.delete(songId) : next.add(songId);
      return next;
    });
    setWarning(null);
  };

  // ── YT search ───────────────────────────────────────────────────────────────
  const handleYtSearch = useCallback(async () => {
    if (ytQuery.trim().length < 2) return;
    ytAbortRef.current?.abort();
    ytAbortRef.current = new AbortController();
    setYtSearching(true);
    setYtResults([]);
    setYtReadyIds(new Set());
    setYtUnavailableIds(new Set());
    setYtLoadingIds(new Set());
    setYtSelectedIds(new Set());
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/youtube/search?q=${encodeURIComponent(ytQuery)}`,
        { signal: ytAbortRef.current.signal }
      );
      const data = await res.json();
      const results: YTResult[] = (data.results || []).slice(0, 8);
      setYtResults(results);
      setYtLoadingIds(new Set(results.map(r => r.videoId)));

      await Promise.all(
        results.map(async r => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoId: r.videoId }),
            });
            if (res.ok) setYtReadyIds(prev => new Set([...prev, r.videoId]));
            else setYtUnavailableIds(prev => new Set([...prev, r.videoId]));
          } catch {
            setYtUnavailableIds(prev => new Set([...prev, r.videoId]));
          } finally {
            setYtLoadingIds(prev => { const n = new Set(prev); n.delete(r.videoId); return n; });
          }
        })
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('Erro ao pesquisar.');
    } finally {
      setYtSearching(false);
    }
  }, [ytQuery]);

  const toggleYtSelect = (r: YTResult) => {
    if (ytUnavailableIds.has(r.videoId)) return;
    setYtSelectedIds(prev => {
      const next = new Set(prev);
      next.has(r.videoId) ? next.delete(r.videoId) : next.add(r.videoId);
      return next;
    });
  };

  // ── FINISH — commit everything ───────────────────────────────────────────────
const handleFinish = async () => {
  if (totalSelected === 0) return;
  setCommitting(true);

  let dbOk = 0, ytOk = 0, failed = 0, dupes = 0;

  // 1. DB songs — batch insert
  if (selectedSongs.size > 0) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlist-songs/batch`, {
      method: 'POST',
      body: JSON.stringify({
        playlist_id: playlistId,
        song_ids: Array.from(selectedSongs),
      }),
    });
    if (res.ok) dbOk = selectedSongs.size;
    else failed += selectedSongs.size;
  }

  // 2. YT songs
  if (ytSelectedIds.size > 0) {
    const selected = ytResults.filter(r => ytSelectedIds.has(r.videoId));
    await Promise.allSettled(
      selected.map(async r => {
        try {
          // upsert song
          const songRes = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs`, {
            method: 'POST',
            body: JSON.stringify({
              title: r.title,
              author: r.artist,
              source: 'youtube',
              youtube_video_id: r.videoId,
              thumbnail: r.thumbnail,
            }),
          });
          if (!songRes.ok) throw new Error('song insert failed');
          const { id: songId } = await songRes.json();

          // link to playlist
          const linkRes = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlist-songs`, {
            method: 'POST',
            body: JSON.stringify({ playlist_id: playlistId, song_id: String(songId), upsert: true }),
          });
          if (!linkRes.ok) {
            const err = await linkRes.json();
            if (err.error?.includes('23505')) dupes++;
            else throw new Error('link failed');
          } else {
            ytOk++;
          }
        } catch {
          failed++;
        }
      })
    );
  }

  setCommitting(false);
  const total = dbOk + ytOk;
  if (total > 0) toast.success(`${total} track${total > 1 ? 's' : ''} adicionada${total > 1 ? 's' : ''}!`);
  if (dupes > 0) toast.error(`${dupes} já estava${dupes > 1 ? 'm' : ''} na playlist`);
  if (failed > 0) toast.error(`${failed} falhara${failed > 1 ? 'm' : ''}`);
  handleClose();
  refreshPlaylist();
};

  const open = inlineOpen || isOpen;

  // ── render ──────────────────────────────────────────────────────────────────
  const inner = (
    <div className="flex flex-col gap-y-3">

      {/* Tab switcher */}
      <div className="flex border-b border-red-900/20">
        {(['db', 'yt'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest transition border-b-2 -mb-px ${
              tab === t ? 'border-red-500 text-red-400' : 'border-transparent text-neutral-600'
            }`}
          >
            {t === 'db' ? `BIBLIOTECA${selectedSongs.size > 0 ? ` [${selectedSongs.size}]` : ''}` : `YOUTUBE${ytSelectedIds.size > 0 ? ` [${ytSelectedIds.size}]` : ''}`}
          </button>
        ))}
      </div>

      {/* DB tab */}
      {tab === 'db' && (
        <div className="flex flex-col gap-y-3">
          <input
            type="text"
            placeholder="PESQUISAR ARTISTA / TRACK..."
            className="w-full bg-neutral-900 border border-red-900/30 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-2.5 placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50"
            style={{ clipPath: SLASH6 }}
            value={searchTerm}
            onChange={e => handleDbSearch(e.target.value)}
          />

          {warning && (
            <p className="text-red-500 font-mono text-[9px] uppercase tracking-widest border border-red-500/20 bg-red-500/5 px-3 py-2">
              ⚠ {warning}
            </p>
          )}

          <div className="max-h-60 overflow-y-auto flex flex-col gap-y-0.5 pr-1">
            {dbSearching && (
              <div className="flex items-center justify-center py-6 gap-x-2">
                <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-red-600/40 font-mono text-[9px] uppercase tracking-widest">A_PESQUISAR...</span>
              </div>
            )}
            {!dbSearching && searchTerm.length < 2 && (
              <p className="text-neutral-700 font-mono text-[9px] uppercase tracking-widest text-center py-6">
                ESCREVE PARA PESQUISAR
              </p>
            )}
            {!dbSearching && searchTerm.length >= 2 && dbResults.length === 0 && (
              <p className="text-neutral-700 font-mono text-[9px] uppercase tracking-widest text-center py-6">
                SEM_RESULTADOS
              </p>
            )}
            {dbResults.map(song => (
              <div
                key={song.id}
                onClick={() => handleCheckboxChange(String(song.id))}
                className={`flex items-center gap-x-2 cursor-pointer border-l-2 transition ${
                  selectedSongs.has(String(song.id))
                    ? 'border-red-500 bg-red-500/5'
                    : playlistSongs.has(String(song.id))
                    ? 'border-neutral-800 opacity-40'
                    : 'border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0 pointer-events-none">
                  <MediaItem data={song} />
                </div>
                <div
                  className={`flex-shrink-0 w-4 h-4 mr-2 border transition ${
                    selectedSongs.has(String(song.id)) ? 'bg-red-500 border-red-500' : 'border-neutral-700'
                  }`}
                  style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
                >
                  {selectedSongs.has(String(song.id)) && (
                    <span className="flex items-center justify-center w-full h-full text-white text-[8px] font-black">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YT tab */}
      {tab === 'yt' && (
        <div className="flex flex-col gap-y-3">
          <div className="flex gap-x-2">
            <input
              type="text"
              placeholder="PESQUISAR_YOUTUBE..."
              className="flex-1 bg-neutral-900 border border-red-900/30 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-2.5 placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50"
              style={{ clipPath: SLASH6 }}
              value={ytQuery}
              onChange={e => setYtQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleYtSearch()}
            />
            <button
              onClick={handleYtSearch}
              disabled={ytSearching}
              className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition disabled:opacity-40"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#f87171',
                clipPath: SLASH6,
              }}
            >
              {ytSearching
                ? <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                : 'GO'}
            </button>
          </div>

          <div className=" overflow-y-auto flex flex-col gap-y-1">
            {ytResults.map(r => {
              const isUnavailable = ytUnavailableIds.has(r.videoId);
              const isLoading = ytLoadingIds.has(r.videoId);
              const isSelected = ytSelectedIds.has(r.videoId);
              return (
                <div
                  key={r.videoId}
                  onClick={() => !isUnavailable && !isLoading && toggleYtSelect(r)}
                  className={`flex items-center gap-x-3 p-2 transition cursor-pointer border-l-2 ${
                    isUnavailable ? 'opacity-30 cursor-not-allowed border-neutral-800' :
                    isSelected ? 'border-red-500 bg-red-500/5' :
                    'border-transparent '
                  }`}
                >
                  <div className="relative w-10 h-10 overflow-hidden flex-shrink-0 bg-neutral-800">
                    <Image src={r.thumbnail} alt={r.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-white text-xs font-black uppercase tracking-tight truncate">{r.title}</p>
                    <p className="text-red-600/40 font-mono text-[9px] uppercase tracking-widest truncate">{r.artist}</p>
                  </div>
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {isLoading
                      ? <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                      : isUnavailable
                      ? <MdOutlineNotInterested size={14} className="text-neutral-700" />
                      : isSelected
                      ? <div className="w-4 h-4 bg-red-500 flex items-center justify-center"
                          style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
                          <span className="text-white text-[8px] font-black">✓</span>
                        </div>
                      : <div className="w-4 h-4 border border-neutral-700"
                          style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }} />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single FINISH button */}
      <button
        onClick={handleFinish}
        disabled={totalSelected === 0 || committing}
        className="w-full py-3 text-[10px] font-mono uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: totalSelected > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${totalSelected > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.05)'}`,
          color: totalSelected > 0 ? '#f87171' : '#4b4b4b',
          clipPath: SLASH8,
        }}
      >
        {committing
          ? <span className="flex items-center justify-center gap-x-2">
              <span className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
              A_SINCRONIZAR...
            </span>
          : totalSelected > 0
          ? `ADICIONAR ${totalSelected} TRACK${totalSelected > 1 ? 'S' : ''}`
          : 'SELECIONAR TRACKS'
        }
      </button>
    </div>
  );

  if (inlineOpen) return inner;

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center justify-center w-10 h-10 border border-red-500/30 bg-red-500/5"
        style={{ clipPath: SLASH8 }}
        title="Adicionar músicas"
      >
        <CiCirclePlus size={22} className="text-red-400" />
      </button>

      <ModalToAddNewSongs isOpen={isOpen} onClose={handleClose} title="SYNC_TRACKS">
        {inner}
      </ModalToAddNewSongs>
    </>
  );
};

export default AddNewSongs;