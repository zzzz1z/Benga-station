'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Image from 'next/image';
import { Playlist } from '@/types';
import MediaItem from '@/components/MediaItem';
import AddNewSongs from './AddNewSongs';
import PlaySongsFromPlaylist from './playSongsFromPlaylist';
import DeletePlaylist from './deletePlaylist';
import ShuffleSongs from './ShuffleSongs';
import EditPlaylist from './EditPlaylist';
import useOnPlaylist from '@/hooks/useOnPlaylist';
import toast from 'react-hot-toast';
import { MdOutlineAddPhotoAlternate } from 'react-icons/md';
import { scheduleWarm } from '@/utils/warmCache';

// Define the geometric clip-path shape.
// This creates a complex octagon-like shape often seen in sci-fi/gaming UIs.
const GAMISH_SHAPE = "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)";

const supabase = createClient();

const getSongPlayerId = (song: any): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const PlaylistDetails: React.FC = () => {
    const { id } = useParams();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingCover, setUploadingCover] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const onPlay = useOnPlaylist();

    const fetchPlaylist = async () => {
        setLoading(true);
        try {
            const { data: playlistData, error: playlistError } = await supabase
                .from('Playlists')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (playlistError) throw playlistError;

            const { data: songData, error: songError } = await supabase
                .from('playlist_songs')
                .select('Songs(*)')
                .eq('playlist_id', id);

            if (songError) throw songError;

            if (playlistData && songData) {
                const songs = songData.map((item: any) => item.Songs);
                setPlaylist({ ...playlistData, songs });

                const ytIds = songs
                    .filter((s: any) => s.source === 'youtube' && s.youtube_video_id)
                    .map((s: any) => s.youtube_video_id);
                scheduleWarm(ytIds);
            }
        } catch (error) {
            console.error('Error fetching playlist or songs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        fetchPlaylist();
    }, [id]);

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
            toast.success('Capa atualizada!');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao atualizar capa.');
        } finally {
            setUploadingCover(false);
            if (coverInputRef.current) coverInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-white">Carregando...</p>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-white">Lista de reprodução não encontrada</p>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
            <Header>
                <div className="mt-20">
                    <div className="flex flex-col md:flex-row items-center gap-x-8">

                        {/* --- START BIG 'GAMISH' COVER --- */}
                        {/* 
                          This outer container provides the neon glow shadow. 
                          Sizing: h-40 w-40 (standard) -> h-64 w-64 (massive on desktop)
                        */}
                        <div 
                          className="relative h-48 w-48 md:h-56 md:w-56 lg:h-64 lg:w-64 group flex-shrink-0 cursor-pointer shadow-[0_0_20px_2px_rgba(56,189,61,0.5)] active:scale-95 transition-transform duration-150"
                          onClick={() => coverInputRef.current?.click()}
                          style={{ clipPath: GAMISH_SHAPE }} // Apply the geometric cut shape to the container
                        >
                            {/* 
                              Inner container for the actual geometric border outline.
                              We provide a gradient background that shows through a padding.
                            */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 p-[3px]">
                              <div 
                                className="relative w-full h-full bg-black overflow-hidden"
                                style={{ clipPath: GAMISH_SHAPE }} // Re-apply shape to mask the inner content
                              >
                                  <Image
                                      fill
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      alt="Capa da playlist"
                                      className="object-cover"
                                      src={playlist.cover_image || '/images/likedit.png'}
                                      priority
                                  />

                                  {/* Hover overlay inside the geometric mask */}
                                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center gap-y-2 text-center p-4">
                                      {uploadingCover
                                          ? <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin shadow-[0_0_10px_emerald]" />
                                          : <>
                                              <MdOutlineAddPhotoAlternate size={36} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(56,189,61,1)]" />
                                              <span className="text-white text-sm font-bold uppercase tracking-wider">Altere a capa</span>
                                          </>
                                      }
                                  </div>
                              </div>
                            </div>
                            <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCoverUpload}
                            />
                        </div>
                        {/* --- END BIG 'GAMISH' COVER --- */}

                        <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
                            <div className="flex items-center gap-x-4">
                                <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter">
                                    {playlist.title}
                                </h1>
                                {/* EDIT BUTTON COMPONENT */}
                                <EditPlaylist data={playlist} onUpdate={fetchPlaylist} />
                            </div>
                            
                            {/* PLAYLIST DESCRIPTION */}
                            {playlist.description && (
                                <p className="text-neutral-400 text-base md:text-lg font-medium max-w-md">
                                    {playlist.description}
                                </p>
                            )}
                            
                            <p className="text-emerald-400 text-sm font-bold">{playlist.songs.length} músicas</p>
                        </div>
                    </div>
                </div>
            </Header>

            <div className="flex justify-center items-center gap-3 m-auto mt-4 mb-4 h-10 px-5">
                <PlaySongsFromPlaylist songs={playlist.songs} />
                <ShuffleSongs songs={playlist.songs} />
                <AddNewSongs playlistId={playlist.id} refreshPlaylist={fetchPlaylist} />
                <DeletePlaylist data={playlist} />
            </div>

            <div>
                <ul className="flex-col p-5 items-center justify-center">
                    {playlist.songs.map((song) => (
                        <MediaItem
                            key={song.id}
                            data={song}
                            onClick={() => onPlay(getSongPlayerId(song), playlist.songs)}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PlaylistDetails;