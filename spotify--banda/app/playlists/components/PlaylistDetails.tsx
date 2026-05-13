'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Image from 'next/image';
import { Playlist, Song } from '@/types';
import MediaItem from '@/components/MediaItem';
import AddNewSongs from './AddNewSongs';
import PlaySongsFromPlaylist from './playSongsFromPlaylist';
import DeletePlaylist from './deletePlaylist';
import ShuffleSongs from './ShuffleSongs';
import useOnPlaylist from '@/hooks/useOnPlaylist';
import toast from 'react-hot-toast';
import { MdOutlineAddPhotoAlternate } from 'react-icons/md';

const supabase = createClient();

const getSongPlayerId = (song: any): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const preExtractPlaylist = (songs: Song[]) => {
    songs.forEach((song, i) => {
        if (song.source !== 'youtube' || !song.youtube_video_id) return;
        setTimeout(() => {
            fetch('/api/preextract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: song.youtube_video_id }),
            }).catch(() => {});
        }, i * 300); // stagger 300ms so first songs get priority
    });
};

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
                setPlaylist({
                    ...playlistData,
                    songs,
                });
                // Warm the worker cache for all YT songs as soon as playlist loads
                preExtractPlaylist(songs);
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
                    <div className="flex flex-col md:flex-row items-center gap-x-5">

                        {/* Cover — click to change */}
                        <div
                            className="relative h-32 w-32 lg:h-44 lg:w-44 group cursor-pointer flex-shrink-0"
                            onClick={() => coverInputRef.current?.click()}
                        >
                            <Image
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                alt="Capa da playlist"
                                className="object-cover rounded-md"
                                src={playlist.cover_image || '/images/likedit.png'}
                                priority
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-md flex flex-col items-center justify-center gap-y-1">
                                {uploadingCover
                                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <>
                                        <MdOutlineAddPhotoAlternate size={24} className="text-white" />
                                        <span className="text-white text-xs font-medium">Alterar capa</span>
                                    </>
                                }
                            </div>
                            <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCoverUpload}
                            />
                        </div>

                        <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
                            <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-bold">
                                {playlist.title}
                            </h1>
                            <p className="text-neutral-400 text-sm">{playlist.songs.length} músicas</p>
                        </div>
                    </div>
                </div>
            </Header>

            <div className="flex justify-center items-center gap-3 m-auto mt-4 mb-4 h-10">
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