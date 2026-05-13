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

    const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
    player.setQueue(shuffledSongs, getSongPlayerId(shuffledSongs[0]));
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