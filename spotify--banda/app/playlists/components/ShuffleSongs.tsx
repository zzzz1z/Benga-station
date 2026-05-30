'use client';

import React from 'react';
import { Song } from '@/types';
import { CiShuffle } from 'react-icons/ci';
import usePlayer from '@/hooks/usePlayer';
import toast from 'react-hot-toast';
import { QueueContext } from '@/hooks/usePlayer';

interface ShuffleSongsProps {
  songs: Song[];
  playlistId?: string;
  playlistName?: string;
}

const getSongPlayerId = (song: Song): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const ShuffleSongs: React.FC<ShuffleSongsProps> = ({ songs, playlistId, playlistName }) => {
  const player = usePlayer();

  const handleShufflePlay = () => {
    if (songs.length === 0) {
      toast.error('Esta playlist não tem músicas.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * songs.length);
    const startId = getSongPlayerId(songs[randomIndex]);
    const context: QueueContext = {
      source: 'playlist',
      playlistId: playlistId ? String(playlistId) : undefined,
      playlistName,
    };
    player.setQueue(songs, startId, context);
    player.setShuffleOn(true);
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