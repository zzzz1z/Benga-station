// app/account/components/CasaTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/utils/supabase/client';
import { Song, Playlist } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import usePlayer from '@/hooks/usePlayer';
import useOnPlay from '@/hooks/useOnPlay';
import { AiFillHeart } from 'react-icons/ai';
import { SlPlaylist } from 'react-icons/sl';

const supabase = createClient();

const CasaTab = () => {
    const { user } = useUser();
    const router = useRouter();
    const player = usePlayer();

    const [likedSongs, setLikedSongs] = useState<Song[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);

    const onPlay = useOnPlay(likedSongs);

    useEffect(() => {
        if (!user?.id) return;

        const fetchData = async () => {
            setLoading(true);

            const [likedRes, playlistRes] = await Promise.all([
                supabase
                    .from('liked_songs')
                    .select('songs(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(6),
                supabase
                    .from('playlists')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(6),
            ]);

            if (likedRes.data) {
                setLikedSongs(likedRes.data.map((d: any) => d.songs).filter(Boolean));
            }
            if (playlistRes.data) {
                setPlaylists(playlistRes.data);
            }

            setLoading(false);
        };

        fetchData();
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-8 px-6 py-6">

            {/* Liked songs */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-x-2">
                        <AiFillHeart size={18} className="text-red-500" />
                        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                            Músicas favoritas
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push('/liked')}
                        className="text-xs text-neutral-400 hover:text-white transition"
                    >
                        Ver todas
                    </button>
                </div>

                {likedSongs.length === 0
                    ? <p className="text-neutral-500 text-sm">Ainda sem favoritos.</p>
                    : (
                        <div className="flex flex-col gap-y-1">
                            {likedSongs.map(song => (
                                <div
                                    key={song.id}
                                    onClick={() => onPlay(String(song.id))}
                                    className="flex items-center gap-x-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition"
                                >
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-neutral-700">
                                        {song.image_path && (
                                            <Image
                                                fill
                                                src={song.image_path}
                                                alt={song.title}
                                                className="object-cover"
                                                sizes="40px"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{song.title}</p>
                                        <p className="text-neutral-400 text-xs truncate">{song.author}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>

            {/* Playlists */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-x-2">
                        <SlPlaylist size={16} className="text-neutral-400" />
                        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                            As minhas playlists
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push('/playlists')}
                        className="text-xs text-neutral-400 hover:text-white transition"
                    >
                        Ver todas
                    </button>
                </div>

                {playlists.length === 0
                    ? <p className="text-neutral-500 text-sm">Ainda sem playlists.</p>
                    : (
                        <div className="grid grid-cols-2 gap-3">
                            {playlists.map(pl => (
                                <div
                                    key={pl.id}
                                    onClick={() => router.push(`/playlists/${pl.id}`)}
                                    className="flex items-center gap-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
                                >
                                    <div className="w-10 h-10 rounded-md bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                        <SlPlaylist size={16} className="text-neutral-400" />
                                    </div>
                                    <p className="text-white text-sm font-medium truncate">{pl.title}</p>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>

        </div>
    );
};

export default CasaTab;