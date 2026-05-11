'use client';

import { Song, Playlist } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useOnPlay from '@/hooks/useOnPlay';
import useLoadImage from '@/hooks/useLoadImage';
import useLoadImagePlaylist from '@/hooks/useLoadImagePlaylist';
import { AiFillHeart } from 'react-icons/ai';
import { SlPlaylist } from 'react-icons/sl';
import MediaItem from '@/components/MediaItem';

interface CasaTabProps {
    likedSongs: Song[];
    playlists: Playlist[];
}

// Wrapper to detect YT vs DB songs
const SongRow = ({ song, onPlay }: { song: Song; onPlay: (id: string) => void }) => {
    const isYT = song.source === 'youtube' && song.youtube_video_id;

    if (isYT) {
        // Minimal inline row for YT songs since YTSearchItem expects a YTResult shape
        return (
            <div
                onClick={() => onPlay(String(song.id))}
                className="flex items-center gap-x-3 p-2 rounded-lg hover:bg-neutral-800/50 cursor-pointer transition group"
            >
                <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-neutral-700">
                    {song.image_path && (
                        <Image
                            fill
                            src={song.image_path}
                            alt={song.title}
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                        />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="text-white text-sm font-medium truncate">{song.title}</p>
                    <p className="text-neutral-400 text-xs truncate">{song.author}</p>
                </div>
            </div>
        );
    }

    return <MediaItem data={song} onClick={() => onPlay(String(song.id))} />;
};

const PlaylistCard = ({ playlist }: { playlist: Playlist }) => {
    const imageUrl = useLoadImagePlaylist(playlist);
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/playlists/${playlist.id}`)}
            className="flex flex-col cursor-pointer group"
        >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-700 mb-2">
                {imageUrl ? (
                    <Image
                        fill
                        src={imageUrl}
                        alt={playlist.title}
                        className="object-cover group-hover:scale-105 transition duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <SlPlaylist size={28} className="text-neutral-500" />
                    </div>
                )}
            </div>
            <p className="text-white text-sm font-medium truncate px-0.5">{playlist.title}</p>
        </div>
    );
};

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
                        <div className="flex flex-col">
                            {likedSongs.slice(0, 6).map(song => (
                                <SongRow
                                    key={song.id}
                                    song={song}
                                    onPlay={onPlay}
                                />
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
                        <div className="grid grid-cols-2 gap-4">
                            {playlists.slice(0, 6).map(pl => (
                                <PlaylistCard key={pl.id} playlist={pl} />
                            ))}
                        </div>
                    )
                }
            </div>

        </div>
    );
};

export default CasaTab;