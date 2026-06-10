'use client';

import React from 'react';
import { CiPlay1 } from "react-icons/ci";
import { Song } from '@/types';
import useOnPlay, { getSongPlayerId } from '@/hooks/useOnPlay';
import toast from 'react-hot-toast';

interface PlaySongsFromPlaylistProps {
  songs: Song[];
  playlistId?: string;
  playlistName?: string;
}

const PlaySongsFromPlaylist: React.FC<PlaySongsFromPlaylistProps> = ({ songs, playlistId, playlistName }) => {
  const onPlay = useOnPlay();

  const handleClick = () => {
    if (songs.length === 0) {
      toast.error('Esta playlist não tem músicas.');
      return;
    }
    onPlay(getSongPlayerId(songs[0]), songs, {
      source: 'playlist',
      playlistId: playlistId ? String(playlistId) : undefined,
      playlistName,
    });
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-full p-2 flex items-center justify-center cursor-pointer"
    >
      <CiPlay1 size={30} />
    </button>
  );
};

export default PlaySongsFromPlaylist;