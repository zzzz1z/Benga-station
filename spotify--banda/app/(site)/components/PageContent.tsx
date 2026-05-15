'use client';

import { Song } from "@/types";
import SongItem from "@/components/SongItem";
import usePlayer from "@/hooks/usePlayer";
import { useUser } from "@/hooks/useUser";
import useAuthModal from "@/hooks/useAuthModal";
import { useMemo } from "react";
import { HiFire } from "react-icons/hi";

interface PageContentProps {
  songs: Song[];       // displayed songs (sliced/randomized)
  allSongs: Song[];    // full list used as queue source
}

const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const PageContent: React.FC<PageContentProps> = ({ songs, allSongs }) => {
  const player = usePlayer();
  const { user } = useUser();
  const authModal = useAuthModal();

  const displayed = useMemo(() =>
    [...songs].sort(() => Math.random() - 0.5).slice(0, 8),
    [songs]
  );

  const handleClick = (song: Song) => {
    if (!user) { authModal.onOpen('sign_up'); return; }

    const clickedId = getSongPlayerId(song);
    const { ids, activeID } = usePlayer.getState();

    // Already playing this song — do nothing
    if (activeID === clickedId) return;

    if (ids.length > 0) {
      // Queue exists — append if not present and jump to it
      const alreadyInQueue = ids.includes(clickedId);
      if (!alreadyInQueue) {
        player.appendToQueue([song]);
      }
      player.setId(clickedId);
    } else {
      // No queue — set full allSongs as queue starting at clicked song
      player.setQueue(allSongs, clickedId);
    }
  };

  if (songs.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-y-4">
        <div className="w-12 h-1 bg-red-600/20 animate-pulse" />
        <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-xs">
          Nenhuma música detectada no sistema
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 px-2">
      <div className="flex items-center gap-x-4 mb-8">
        <div
          className="bg-red-600 p-2 text-black flex items-center justify-center"
          style={{ clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)' }}
        >
          <HiFire size={24} />
        </div>
        <div className="flex flex-col">
          <h2
            className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter italic"
            style={{ textShadow: '0 0 15px rgba(239,68,68,0.4)' }}
          >
            Recomendações de Elite
          </h2>
          <div className="flex items-center gap-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-500/60 text-[10px] font-bold uppercase tracking-widest">
              Status: Live Feed
            </span>
          </div>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 via-red-500/10 to-transparent ml-4" />
      </div>

      <div className="relative group">
        <div className="absolute -inset-4 bg-red-600/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition duration-1000 pointer-events-none" />
        <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-6">
          {displayed.map((item) => (
            <div
              key={item.id}
              className="relative transition-all duration-300 hover:scale-[1.03] active:scale-95"
            >
              <SongItem
                onClick={() => handleClick(item)}
                data={item}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex justify-between items-center border-t border-neutral-800 pt-4">
        <div className="flex gap-x-4">
          <div className="text-[9px] text-neutral-600 font-mono">
            COORD_X: 42.001 <br />
            COORD_Y: 19.998
          </div>
        </div>
        <div className="text-[10px] text-red-500/40 font-black uppercase tracking-[0.2em]">
          Digital Audio Interface v3.0
        </div>
      </div>
    </div>
  );
};

export default PageContent;