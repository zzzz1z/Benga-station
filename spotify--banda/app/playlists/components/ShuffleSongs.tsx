import React from 'react';
import { Song } from '@/types';
import { CiShuffle } from 'react-icons/ci';
import usePlayer from '@/hooks/usePlayer';

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
      alert('No songs available in this playlist.');
      return;
    }

    const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
    player.setQueue(shuffledSongs, getSongPlayerId(shuffledSongs[0]));
  };

  return (
    <div onClick={handleShufflePlay} className="cursor-pointer">
      <button className="rounded-full p-2 flex items-center justify-center hover:opacity-75 transition">
        <CiShuffle size={30} />
      </button>
    </div>
  );
};

export default ShuffleSongs;