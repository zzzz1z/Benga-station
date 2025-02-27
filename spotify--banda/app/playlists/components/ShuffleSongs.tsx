import React from 'react';
import { Playlist } from '@/types';
import { CiShuffle } from 'react-icons/ci';
import useOnPlaylist from '@/hooks/useOnPlaylist';
import usePlayer from '@/hooks/usePlayer';

interface ShuffleSongsProps {
  songs: Playlist['songs']; // List of songs in the playlist
}

const ShuffleSongs: React.FC<ShuffleSongsProps> = ({ songs }) => {


  const player = usePlayer()
  
  const handleShufflePlay = () => {
    if (songs.length === 0) {
        alert('No songs available in this playlist.');
        return;
    }

    // Shuffle the playlist
    const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
    
    // Set the shuffled queue in usePlayer
    player.setQueue(shuffledSongs);

    // Start playing from the first song in shuffled list
    player.setId(shuffledSongs[0].id);
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
