'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/Botão';
import { Song } from '@/types';
import ModalToAddNewSongs from './ModalToAddNewSongs';
import MediaItem from '@/components/MediaItem';
import { CiCirclePlus } from 'react-icons/ci';
import { MdOutlineNotInterested } from 'react-icons/md';
import Image from 'next/image';
import toast from 'react-hot-toast';

const supabase = createClient();

interface YTResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface AddNewSongsProps {
  playlistId: string;
  refreshPlaylist: () => void;
}

const AddNewSongs: React.FC<AddNewSongsProps> = ({ playlistId, refreshPlaylist }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'db' | 'yt'>('db');

  // DB tab state
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [playlistSongs, setPlaylistSongs] = useState<Set<string>>(new Set());
  const [warning, setWarning] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // YT tab state
  const [ytQuery, setYtQuery] = useState('');
  const [ytResults, setYtResults] = useState<YTResult[]>([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [ytReadyIds, setYtReadyIds] = useState<Set<string>>(new Set());
  const [ytUnavailableIds, setYtUnavailableIds] = useState<Set<string>>(new Set());
  const [ytLoadingIds, setYtLoadingIds] = useState<Set<string>>(new Set());
  const [ytSelectedIds, setYtSelectedIds] = useState<Set<string>>(new Set());
  const [ytAdding, setYtAdding] = useState(false);
  const ytAbortRef = useRef<AbortController | null>(null);

  const fetchSongs = async () => {
    const { data, error } = await supabase.from('Songs').select('*');
    if (!error) setSongs(data || []);
  };

  const fetchPlaylistSongs = async () => {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select('song_id')
      .eq('playlist_id', playlistId);
    if (!error) {
      setPlaylistSongs(new Set(data?.map((item: { song_id: string }) => String(item.song_id))));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSongs();
      fetchPlaylistSongs();
    }
  }, [isOpen]);

  // DB tab
  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckboxChange = (songId: string) => {
    if (playlistSongs.has(songId)) {
      setWarning('Essa música já se encontra na playlist atual!!!');
      setTimeout(() => setWarning(null), 4000);
      return;
    }
    setSelectedSongs(prev => {
      const next = new Set(prev);
      next.has(songId) ? next.delete(songId) : next.add(songId);
      return next;
    });
    setWarning(null);
  };

  const handleAddDbSongs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates = Array.from(selectedSongs).map(songId => ({
        user_id: user?.id,
        playlist_id: playlistId,
        song_id: songId,
      }));
      const { error } = await supabase.from('playlist_songs').insert(updates);
      if (error) throw error;
      setIsOpen(false);
      setSelectedSongs(new Set());
      refreshPlaylist();
      toast.success('Músicas adicionadas!');
    } catch {
      toast.error('Erro ao adicionar músicas.');
    }
  };

  // YT tab
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
        `/api/youtube/search?q=${encodeURIComponent(ytQuery)}`,
        { signal: ytAbortRef.current.signal }
      );
      const data = await res.json();
      const results: YTResult[] = (data.results || []).slice(0, 8);
      setYtResults(results);
      setYtLoadingIds(new Set(results.map(r => r.videoId)));

      // preextract all in parallel
      results.forEach(async r => {
        try {
          const res = await fetch('/api/preextract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: r.videoId }),
          });
          if (res.ok) {
            setYtReadyIds(prev => new Set([...prev, r.videoId]));
          } else {
            setYtUnavailableIds(prev => new Set([...prev, r.videoId]));
          }
        } catch {
          setYtUnavailableIds(prev => new Set([...prev, r.videoId]));
        } finally {
          setYtLoadingIds(prev => {
            const next = new Set(prev);
            next.delete(r.videoId);
            return next;
          });
        }
      });
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

  const handleAddYtSongs = async () => {
    if (ytSelectedIds.size === 0) return;
    setYtAdding(true);

    const selected = ytResults.filter(r => ytSelectedIds.has(r.videoId));
    const results = await Promise.allSettled(
      selected.map(r =>
        fetch('/api/playlist/add-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistId,
            song: {
              title: r.title,
              author: r.artist,
              source: 'youtube',
              youtube_video_id: r.videoId,
              image_path: r.thumbnail,
            },
          }),
        }).then(res => ({ res, r }))
      )
    );

    const failed = results.filter(
      r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.res.ok && r.value.res.status !== 409)
    ).length;
    const duplicates = results.filter(
      r => r.status === 'fulfilled' && r.value.res.status === 409
    ).length;
    const succeeded = results.length - failed - duplicates;

    if (succeeded > 0) toast.success(`${succeeded} música${succeeded > 1 ? 's' : ''} adicionada${succeeded > 1 ? 's' : ''}!`);
    if (duplicates > 0) toast.error(`${duplicates} já estava${duplicates > 1 ? 'm' : ''} na playlist`);
    if (failed > 0) toast.error(`${failed} falhara${failed > 1 ? 'm' : ''}`);

    setYtSelectedIds(new Set());
    setYtAdding(false);
    refreshPlaylist();
  };

  const handleClose = () => {
    setIsOpen(false);
    setTab('db');
    setYtQuery('');
    setYtResults([]);
    setYtSelectedIds(new Set());
  };

return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 border border-red-500/30 bg-red-500/5 active:bg-red-500/20 transition"
        style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
        title="Adicionar músicas"
      >
        <CiCirclePlus size={22} className="text-red-400" />
      </button>

      <ModalToAddNewSongs isOpen={isOpen} onClose={handleClose} title="SYNC_TRACKS">

        {/* Tab switcher */}
        <div className="flex border-b border-red-900/20 mb-4">
          {(['db', 'yt'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest transition border-b-2 -mb-px ${
                tab === t
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-neutral-600 active:text-white'
              }`}
            >
              {t === 'db' ? 'BIBLIOTECA' : 'YOUTUBE'}
            </button>
          ))}
        </div>

        {tab === 'db' && (
          <div className="flex flex-col gap-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="PESQUISAR_TRACKS..."
                className="w-full bg-neutral-900 border border-red-900/30 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-2.5 placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50"
                style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {warning && (
              <p className="text-red-500 font-mono text-[9px] uppercase tracking-widest border border-red-500/20 bg-red-500/5 px-3 py-2">
                ⚠ {warning}
              </p>
            )}

            <div className="max-h-60 overflow-y-auto flex flex-col gap-y-0.5 pr-1">
              {filteredSongs.map(song => (
                <div
                  key={song.id}
                  onClick={() => handleCheckboxChange(String(song.id))}
                  className={`flex items-center gap-x-2 cursor-pointer border-l-2 transition ${
                    selectedSongs.has(String(song.id))
                      ? 'border-red-500 bg-red-500/5'
                      : playlistSongs.has(String(song.id))
                      ? 'border-neutral-800 opacity-40'
                      : 'border-transparent active:border-red-900'
                  }`}
                >
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <MediaItem data={song} />
                  </div>
                  <div className={`flex-shrink-0 w-4 h-4 mr-2 border transition ${
                    selectedSongs.has(String(song.id))
                      ? 'bg-red-500 border-red-500'
                      : 'border-neutral-700'
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

            <button
              onClick={handleAddDbSongs}
              disabled={selectedSongs.size === 0}
              className="w-full py-3 text-[10px] font-mono uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: selectedSongs.size > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedSongs.size > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.05)'}`,
                color: selectedSongs.size > 0 ? '#f87171' : '#4b4b4b',
                clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
              }}
            >
              {selectedSongs.size > 0 ? `SYNC ${selectedSongs.size} TRACK${selectedSongs.size > 1 ? 'S' : ''}` : 'SELECIONAR TRACKS'}
            </button>
          </div>
        )}

        {tab === 'yt' && (
          <div className="flex flex-col gap-y-3">
            <div className="flex gap-x-2">
              <input
                type="text"
                placeholder="PESQUISAR_YOUTUBE..."
                className="flex-1 bg-neutral-900 border border-red-900/30 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-2.5 placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50"
                style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
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
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                }}
              >
                {ytSearching ? (
                  <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : 'GO'}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto flex flex-col gap-y-1">
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
                      'border-transparent active:border-red-900'
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

            {ytSelectedIds.size > 0 && (
              <button
                onClick={handleAddYtSongs}
                disabled={ytAdding}
                className="w-full py-3 text-[10px] font-mono uppercase tracking-widest transition disabled:opacity-40"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#f87171',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                }}
              >
                {ytAdding
                  ? <div className="flex items-center justify-center gap-x-2"><div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />A SINCRONIZAR...</div>
                  : `SYNC ${ytSelectedIds.size} TRACK${ytSelectedIds.size > 1 ? 'S' : ''}`
                }
              </button>
            )}
          </div>
        )}
      </ModalToAddNewSongs>
    </>
  );
};

export default AddNewSongs;