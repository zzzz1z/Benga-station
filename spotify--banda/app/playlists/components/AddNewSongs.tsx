'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/Botão';
import { Song } from '@/types';
import ModalToAddNewSongs from './ModalToAddNewSongs';
import MediaItem from '@/components/MediaItem';
import { CiCirclePlus } from 'react-icons/ci';
import { MdOutlineNotInterested } from 'react-icons/md';
import { FaPlay } from 'react-icons/fa';
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
  const [ytLoadingId, setYtLoadingId] = useState<string | null>(null);
  const [ytReadyIds, setYtReadyIds] = useState<Set<string>>(new Set());
  const [ytUnavailableIds, setYtUnavailableIds] = useState<Set<string>>(new Set());
  const [ytAddingId, setYtAddingId] = useState<string | null>(null);
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
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(ytQuery)}`,
        { signal: ytAbortRef.current.signal }
      );
      const data = await res.json();
      const results: YTResult[] = (data.results || []).slice(0, 8);
      setYtResults(results);

      // preextract all in parallel
      results.forEach(async r => {
        setYtLoadingId(r.videoId);
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
          setYtLoadingId(null);
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('Erro ao pesquisar.');
    } finally {
      setYtSearching(false);
    }
  }, [ytQuery]);

  const handleAddYtSong = async (r: YTResult) => {
    if (ytUnavailableIds.has(r.videoId)) return;
    setYtAddingId(r.videoId);
    try {
      const res = await fetch('/api/playlist/add-song', {
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
      });
      if (res.status === 409) toast.error('Música já está na playlist');
      else if (!res.ok) toast.error('Erro ao adicionar música');
      else {
        toast.success('Adicionado à playlist!');
        refreshPlaylist();
      }
    } finally {
      setYtAddingId(null);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <CiCirclePlus size={30} />
      </button>

      <ModalToAddNewSongs
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setTab('db'); setYtQuery(''); setYtResults([]); }}
        title="Adicionar músicas à Playlist"
      >
        {/* Tab switcher */}
        <div className="flex border-b border-neutral-700 mb-3">
          <button
            onClick={() => setTab('db')}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px
              ${tab === 'db' ? 'border-red-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}
          >
            Biblioteca
          </button>
          <button
            onClick={() => setTab('yt')}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px
              ${tab === 'yt' ? 'border-red-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}
          >
            YouTube
          </button>
        </div>

        {tab === 'db' && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Pesquisar..."
              className="p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {warning && <p className="text-red-500 text-xs">{warning}</p>}
            <div className="max-h-60 overflow-y-auto flex flex-col gap-y-1">
              {filteredSongs.map(song => (
                <div key={song.id} className="flex items-center gap-x-2">
                  <div className="flex-1 min-w-0">
                    <MediaItem data={song} />
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedSongs.has(String(song.id))}
                    onChange={() => handleCheckboxChange(String(song.id))}
                    className="flex-shrink-0 accent-red-500 w-4 h-4"
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleAddDbSongs} disabled={selectedSongs.size === 0} className="mt-2">
              Adicionar ({selectedSongs.size})
            </Button>
          </div>
        )}

        {tab === 'yt' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-x-2">
              <input
                type="text"
                placeholder="Pesquisar no YouTube..."
                className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none"
                value={ytQuery}
                onChange={e => setYtQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleYtSearch()}
              />
              <button
                onClick={handleYtSearch}
                disabled={ytSearching}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition disabled:opacity-50"
              >
                {ytSearching ? '...' : 'Pesquisar'}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-y-1 mt-1">
              {ytResults.map(r => {
                const isUnavailable = ytUnavailableIds.has(r.videoId);
                const isReady = ytReadyIds.has(r.videoId);
                const isLoading = ytLoadingId === r.videoId || (!isReady && !isUnavailable);
                const isAdding = ytAddingId === r.videoId;

                return (
                  <div
                    key={r.videoId}
                    className={`flex items-center gap-x-3 p-2 rounded-lg transition
                      ${isUnavailable ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-800 cursor-pointer'}`}
                  >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-neutral-700">
                      <Image src={r.thumbnail} alt={r.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{r.title}</p>
                      <p className="text-neutral-400 text-xs truncate">{r.artist}</p>
                    </div>
                    <button
                      onClick={() => !isUnavailable && !isAdding && handleAddYtSong(r)}
                      disabled={isUnavailable || isAdding}
                      className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-40"
                    >
                      {isAdding
                        ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        : isUnavailable
                        ? <MdOutlineNotInterested size={14} />
                        : isLoading
                        ? <div className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin" />
                        : '+ Adicionar'
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ModalToAddNewSongs>
    </>
  );
};

export default AddNewSongs;