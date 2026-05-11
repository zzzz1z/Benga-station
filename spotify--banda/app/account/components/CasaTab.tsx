'use client';

import { Song, Playlist } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useOnPlay from '@/hooks/useOnPlay';
import { AiFillHeart } from 'react-icons/ai';
import { SlPlaylist } from 'react-icons/sl';

interface CasaTabProps {
    likedSongs: Song[];
    playlists: Playlist[];
}

const CasaTab = ({ likedSongs, playlists }: CasaTabProps) => {
    const router = useRouter();
    const onPlay = useOnPlay(likedSongs);

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
                            {likedSongs.slice(0, 6).map(song => (
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
                            {playlists.slice(0, 6).map(pl => (
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