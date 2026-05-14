'use client';

import React from 'react';
import { CiPlay1 } from "react-icons/ci";
import { Song } from '@/types';
import useOnPlay, { getSongPlayerId } from '@/hooks/useOnPlay';
import toast from 'react-hot-toast';

interface PlaySongsFromPlaylistProps {
  songs: Song[];
}

const PlaySongsFromPlaylist: React.FC<PlaySongsFromPlaylistProps> = ({ songs }) => {
  const onPlay = useOnPlay();

  const handleClick = () => {
    if (songs.length === 0) {
      toast.error('Esta playlist não tem músicas.');
      return;
    }
    // Uses the merged hook — warms the first song + its neighbours before setQueue
    onPlay(getSongPlayerId(songs[0]), songs);
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-full p-2 flex items-center justify-center hover:opacity-75 transition cursor-pointer"
    >
      <CiPlay1 size={30} />
    </button>
  );
};

export default PlaySongsFromPlaylist;