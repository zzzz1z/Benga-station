'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { Playlist } from '@/types';
import MediaItem from '@/components/MediaItem';
import AddNewSongs from './AddNewSongs';
import PlaySongsFromPlaylist from './playSongsFromPlaylist';
import DeletePlaylist from './deletePlaylist';
import ShuffleSongs from './ShuffleSongs';
import EditPlaylist from './EditPlaylist';
import toast from 'react-hot-toast';
import { MdOutlineAddPhotoAlternate } from 'react-icons/md';
import useOnPlay from '@/hooks/useOnPlay';
import { useRefresh } from '@/hooks/useRefresh';

const supabase = createClient();

const GAMER_CUT = "polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)";
const BADGE_CUT = "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)";

const getSongPlayerId = (song: any): string => {
  if (!song) return '';
  if (song.source === 'youtube' && song.youtube_video_id) return `yt_${song.youtube_video_id}`;
  return String(song.id);
};

const SkeletonRow = () => (
  <div className="flex items-center gap-x-3 px-2 py-2 animate-pulse">
    <div className="w-10 h-10 rounded bg-neutral-800 flex-shrink-0" />
    <div className="flex flex-col gap-y-1 flex-1">
      <div className="h-3 bg-neutral-800 rounded w-2/3" />
      <div className="h-2 bg-neutral-800 rounded w-1/3" />
    </div>
  </div>
);

const PlaylistDetails: React.FC = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [songsLoading, setSongsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const onPlay = useOnPlay();
  const { refreshKey } = useRefresh();

  const fetchPlaylist = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setSongsLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    setSongsLoading(true);

    try {
      const [playlistRes, songRes] = await Promise.all([
        supabase.from('Playlists').select('*').eq('id', id).maybeSingle(),
        supabase.from('playlist_songs').select('Songs(*)').eq('playlist_id', id),
      ]);

      if (playlistRes.error) {
        setError('Playlist não encontrada.');
        setLoading(false);
        setSongsLoading(false);
        return;
      }

      setPlaylist(playlistRes.data);
      setLoading(false);

      if (songRes.error) {
        setSongsLoading(false);
        return;
      }

      const fetchedSongs = (songRes.data ?? [])
        .map((item: any) => item.Songs)
        .filter(Boolean);

      setSongs(fetchedSongs);
      setSongsLoading(false);
      setPlaylist(prev => prev ? { ...prev, songs: fetchedSongs } : prev);

      const ytIds = fetchedSongs
        .filter((s: any) => s.source === 'youtube' && s.youtube_video_id)
        .map((s: any) => s.youtube_video_id);
      if (ytIds.length) {
        fetch('/api/preextract-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds: ytIds }),
        }).catch(() => {});
      }
    } catch {
      setError('Erro inesperado.');
      setLoading(false);
      setSongsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  useEffect(() => {
    if (refreshKey === 0) return;
    fetchPlaylist();
  }, [refreshKey, fetchPlaylist]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !playlist) return;
    setUploadingCover(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('playlist-covers')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('playlist-covers')
        .getPublicUrl(uploadData.path);
      const { error: updateError } = await supabase
        .from('Playlists')
        .update({ cover_image: urlData.publicUrl })
        .eq('id', playlist.id);
      if (updateError) throw updateError;
      setPlaylist(prev => prev ? { ...prev, cover_image: urlData.publicUrl } : prev);
      toast.success('Capa sincronizada!');
    } catch {
      toast.error('Falha no upload.');
    } finally {
      setUploadingCover(false);
    }
  };

  if (error) return (
    <div className="p-20 text-white flex flex-col gap-y-4">
      <p>{error}</p>
      <button onClick={fetchPlaylist} className="text-red-500 text-sm underline">Tentar novamente</button>
    </div>
  );

  if (loading) return (
    <div className="bg-neutral-900 rounded-lg h-full w-full pt-[65px] overflow-hidden overflow-y-auto">
      <div className="p-6 animate-pulse flex flex-col gap-y-6">
        <div className="flex flex-col md:flex-row items-center gap-x-8 mt-20">
          <div className="w-56 h-56 bg-neutral-800 rounded-lg flex-shrink-0" />
          <div className="flex flex-col gap-y-4 mt-6 md:mt-0 w-full max-w-sm">
            <div className="h-4 bg-neutral-800 rounded w-20" />
            <div className="h-12 bg-neutral-800 rounded w-full" />
            <div className="h-4 bg-neutral-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!playlist) return <div className="p-20 text-white">Playlist não encontrada.</div>;

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full pt-3 overflow-hidden overflow-y-auto relative">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.015) 3px, rgba(239,68,68,0.015) 4px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px z-10"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)' }} />

        <div className="mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-x-8 px-6">
            <div
              className="relative h-56 w-56 md:h-64 md:w-64 group flex-shrink-0 cursor-pointer transition-transform active:scale-95"
              onClick={() => coverInputRef.current?.click()}
            >
              <div className="absolute inset-0 rounded-lg blur-xl opacity-40 animate-pulse"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.8), transparent 70%)' }} />
              <div className="relative w-full h-full bg-red-500 p-[2px]"
                style={{ clipPath: GAMER_CUT, filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' }}>
                <div className="relative w-full h-full bg-neutral-900 overflow-hidden" style={{ clipPath: GAMER_CUT }}>
                  <Image fill alt="Playlist Cover" className="object-cover"
                    src={playlist.cover_image || '/images/likedit.png'} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-y-2">
                    {uploadingCover
                      ? <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                      : <>
                          <MdOutlineAddPhotoAlternate size={32} className="text-red-500" />
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">Atualizar Capa</span>
                        </>
                    }
                  </div>
                </div>
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>

            <div className="flex flex-col gap-y-4 mt-6 md:mt-0 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-x-4 gap-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', clipPath: BADGE_CUT }}>
                  Playlist
                </span>
                <div className="flex items-center gap-x-3">
                  <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase"
                    style={{ textShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
                    {playlist.title}
                  </h1>
                  <EditPlaylist data={playlist} onUpdate={fetchPlaylist} />
                </div>
              </div>
              {playlist.description && (
                <p className="text-neutral-400 text-sm md:text-base font-medium max-w-lg leading-relaxed italic border-l-2 border-red-500/50 pl-4">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-x-6">
                <div className="flex flex-col">
                  <span className="text-white font-black text-2xl tabular-nums leading-none">{songs.length}</span>
                  <span className="text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-bold">Músicas</span>
                </div>
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-red-500/40 to-transparent" />
                <div className="flex flex-col">
                  <span className="text-white font-black text-2xl tabular-nums leading-none">LVL.{Math.min(songs.length, 99)}</span>
                  <span className="text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-bold">Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />
      </div>

      <div className="flex justify-center md:justify-start items-center gap-4 px-8 py-6">
        <PlaySongsFromPlaylist songs={songs} />
        <ShuffleSongs songs={songs} />
        <div className="h-8 w-px bg-neutral-800 mx-2" />
        <AddNewSongs playlistId={playlist.id} refreshPlaylist={fetchPlaylist} />
        <DeletePlaylist data={playlist} />
      </div>

      <div className="px-6 pb-24">
        {songsLoading ? (
          <ul className="flex flex-col gap-y-1">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </ul>
        ) : songs.length === 0 ? (
          <p className="text-neutral-500 text-sm px-2 py-4">Nenhuma música nesta playlist.</p>
        ) : (
          <ul className="flex flex-col gap-y-1">
            {songs.map((song) => (
              <MediaItem
                key={song.id}
                data={song}
                onClick={() => onPlay(getSongPlayerId(song), songs)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetails;