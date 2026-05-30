'use client';

import { Song, Playlist } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useOnPlay from '@/hooks/useOnPlay';
import useLoadImagePlaylist from '@/hooks/useLoadImagePlaylist';
import { AiFillHeart } from 'react-icons/ai';
import { SlPlaylist } from 'react-icons/sl';
import { TbChevronRight } from 'react-icons/tb';
import MediaItem from '@/components/MediaItem';

const SLASH = 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)';

interface CasaTabProps {
  likedSongs: Song[];
  playlists: Playlist[];
}

const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const PlaylistRow = ({ playlist }: { playlist: Playlist }) => {
  const imageUrl = useLoadImagePlaylist(playlist);
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/playlists?id=${playlist?.id}`)}
      className="flex items-center gap-x-3 p-2 cursor-pointer active:bg-red-500/5 transition border-l-2 border-transparent active:border-red-500 group"
    >
      <div className="relative w-11 h-11 flex-shrink-0 overflow-hidden bg-neutral-800 border border-red-900/20">
        {imageUrl ? (
          <Image fill src={imageUrl} alt={playlist.title}
            className="object-cover" sizes="44px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <SlPlaylist size={14} className="text-neutral-600" />
          </div>
        )}
        {/* corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/40" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/40" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-white text-xs font-black uppercase tracking-tight truncate">{playlist.title}</p>
        <p className="text-red-600/30 font-mono text-[9px] uppercase tracking-widest">
          DIR::{playlist.songs?.length ?? 0}_TRACKS
        </p>
      </div>
      <TbChevronRight size={12} className="text-neutral-700 flex-shrink-0" />
    </div>
  );
};

const SectionHeader = ({
  icon, label, count, onSeeAll
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  onSeeAll: () => void;
}) => (
  <div className="flex items-center justify-between px-1 mb-1">
    <div className="flex items-center gap-x-2">
      {icon}
      <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-400">{label}</span>
      {count !== undefined && (
        <span className="text-[8px] font-mono text-red-600/30 tracking-widest">[{count}]</span>
      )}
    </div>
    <button
      onClick={onSeeAll}
      className="flex items-center gap-x-1 text-[9px] font-mono uppercase tracking-widest text-neutral-600 active:text-red-400 transition"
    >
      Ver todas <TbChevronRight size={10} />
    </button>
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex items-center gap-x-2 px-3 py-4 border border-red-900/10 bg-white/[0.01]"
    style={{ clipPath: SLASH }}>
    <div className="w-1 h-1 rounded-full bg-red-900/40" />
    <p className="text-neutral-700 font-mono text-[9px] uppercase tracking-widest">{label}</p>
  </div>
);

const CasaTab = ({ likedSongs, playlists }: CasaTabProps) => {
  const router = useRouter();
  const onPlay = useOnPlay(likedSongs);

  return (
    <div className="flex flex-col gap-y-6 px-4 py-4">

      {/* Liked songs */}
      <div className="flex flex-col gap-y-1">
        <SectionHeader
          icon={<AiFillHeart size={11} className="text-red-500/60" />}
          label="Favoritas"
          count={likedSongs.length}
          onSeeAll={() => router.push('/liked')}
        />

        <div className="flex flex-col border border-red-900/15 overflow-hidden relative"
          style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)' }} />

          {likedSongs.length === 0
            ? <EmptyState label="SEM_FAVORITAS" />
            : likedSongs.slice(0, 5).map(song => (
                <div key={song.id} className="border-b border-white/[0.03] last:border-0">
                  <MediaItem
                    data={song}
                    onClick={() => onPlay(getSongPlayerId(song))}
                  />
                </div>
              ))
          }
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-x-3">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.2), transparent)' }} />
        <span className="text-[8px] font-mono text-red-900/30 uppercase tracking-[0.3em]">///</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2))' }} />
      </div>

      {/* Playlists */}
      <div className="flex flex-col gap-y-1">
        <SectionHeader
          icon={<SlPlaylist size={11} className="text-neutral-500" />}
          label="Playlists"
          count={playlists.length}
          onSeeAll={() => router.push('/playlists')}
        />

        <div className="flex flex-col border border-red-900/15 overflow-hidden relative"
          style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)' }} />

          {playlists.length === 0
            ? <EmptyState label="SEM_PLAYLISTS" />
            : playlists.slice(0, 6).map(pl => (
                <div key={pl.id} className="border-b border-white/[0.03] last:border-0">
                  <PlaylistRow playlist={pl} />
                </div>
              ))
          }
        </div>
      </div>

    </div>
  );
};

export default CasaTab;