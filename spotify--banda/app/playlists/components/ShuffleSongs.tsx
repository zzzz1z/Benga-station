'use client';

import React from 'react';
import { Song } from '@/types';
import { CiShuffle } from 'react-icons/ci';
import usePlayer from '@/hooks/usePlayer';
import toast from 'react-hot-toast';

interface ShuffleSongsProps {
  songs: Song[];
}

const getSongPlayerId = (song: Song): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const ShuffleSongs: React.FC<ShuffleSongsProps> = ({ songs }) => {
  const player = usePlayer();

  const handleShufflePlay = () => {
    if (songs.length === 0) {
      toast.error('Esta playlist não tem músicas.');
      return;
    }

    // FIX: Don't pre-shuffle the array — pass original order and let the
    // store's playRandom handle shuffle consistently with the expanded player.
    // This means both shuffle buttons now use the same code path.
    const firstId = getSongPlayerId(songs[0]);
    player.setQueue(songs, firstId);
    player.setShuffleOn(true); // store picks next song randomly via playRandom()
  };

  return (
    <button
      onClick={handleShufflePlay}
      className="rounded-full p-2 flex items-center justify-center hover:opacity-75 transition cursor-pointer"
    >
      <CiShuffle size={30} />
    </button>
  );
};

export default ShuffleSongs;