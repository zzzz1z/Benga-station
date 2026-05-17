'use client';

import { Song, Playlist } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useOnPlay from '@/hooks/useOnPlay';
import useLoadImagePlaylist from '@/hooks/useLoadImagePlaylist';
import { AiFillHeart } from 'react-icons/ai';
import { SlPlaylist } from 'react-icons/sl';
import MediaItem from '@/components/MediaItem';

interface CasaTabProps {
  likedSongs: Song[];
  playlists: Playlist[];
}

const SongRow = ({ song, onPlay }: { song: Song; onPlay: (id: string) => void }) => {
  const isYT = song.source === 'youtube' && song.youtube_video_id;

  if (isYT) {
    return (
      <div
        onClick={() => onPlay(String(song.id))}
        className="flex items-center gap-x-3 p-2 hover:bg-neutral-800/50 cursor-pointer transition group"
      >
        <div className="relative w-10 h-10 overflow-hidden flex-shrink-0 bg-neutral-700">
          {song.image_path && (
            <Image fill src={song.image_path} alt={song.title} className="object-cover" sizes="40px" unoptimized />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-white text-xs font-bold truncate">{song.title}</p>
          <p className="text-neutral-400 text-[10px] truncate">{song.author}</p>
        </div>
      </div>
    );
  }

  return <MediaItem data={song} onClick={() => onPlay(String(song.id))} />;
};

const PlaylistRow = ({ playlist }: { playlist: Playlist }) => {
  const imageUrl = useLoadImagePlaylist(playlist);
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/playlists/${playlist.id}`)}
      className="flex items-center gap-x-3 p-2 hover:bg-neutral-800/40 cursor-pointer transition group rounded-none"
    >
      <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-neutral-700">
        {imageUrl ? (
          <Image
            fill
            src={imageUrl}
            alt={playlist.title}
            className="object-cover group-hover:scale-105 transition duration-300"
            sizes="40px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <SlPlaylist size={16} className="text-neutral-500" />
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-white text-xs font-bold truncate">{playlist.title}</p>
        <p className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">
          {playlist.songs?.length ?? 0} músicas
        </p>
      </div>
    </div>
  );
};

const CasaTab = ({ likedSongs, playlists }: CasaTabProps) => {
  const router = useRouter();
  const onPlay = useOnPlay(likedSongs);

  return (
    <div className="flex flex-col gap-y-6 px-4 py-4">

      {/* Liked songs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-x-2">
            <AiFillHeart size={14} className="text-red-500" />
            <h2 className="text-white font-black text-[10px] uppercase tracking-widest">
              Músicas favoritas
            </h2>
          </div>
          <button
            onClick={() => router.push('/liked')}
            className="text-[10px] text-neutral-500 hover:text-white transition font-mono uppercase tracking-widest"
          >
            Ver todas →
          </button>
        </div>

        {likedSongs.length === 0 ? (
          <p className="text-neutral-600 text-xs font-mono">Ainda sem favoritos.</p>
        ) : (
          <div className="flex flex-col">
            {likedSongs.slice(0, 5).map(song => (
              <SongRow key={song.id} song={song} onPlay={onPlay} />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)' }} />

      {/* Playlists */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-x-2">
            <SlPlaylist size={14} className="text-neutral-400" />
            <h2 className="text-white font-black text-[10px] uppercase tracking-widest">
              As minhas playlists
            </h2>
          </div>
          <button
            onClick={() => router.push('/playlists')}
            className="text-[10px] text-neutral-500 hover:text-white transition font-mono uppercase tracking-widest"
          >
            Ver todas →
          </button>
        </div>

        {playlists.length === 0 ? (
          <p className="text-neutral-600 text-xs font-mono">Ainda sem playlists.</p>
        ) : (
          <div className="flex flex-col">
            {playlists.slice(0, 6).map(pl => (
              <PlaylistRow key={pl.id} playlist={pl} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CasaTab;