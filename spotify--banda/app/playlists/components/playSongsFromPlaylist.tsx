import React from 'react';
import { CiPlay1 } from "react-icons/ci";
import { Playlist, Song } from '@/types';

import useOnPlaylist from '@/hooks/useOnPlaylist';

interface PlaySongsFromPlaylistProps {
  songs: Playlist['songs']; // Accepts a list of songs from the parent
  
}

const PlaySongsFromPlaylist: React.FC<PlaySongsFromPlaylistProps> = ({ songs }) => {


  const onPlay = useOnPlaylist(songs); // Hook to manage playback
  
  const handleClick = () => {
    if (songs.length === 0) {
      alert('No songs available in this playlist.');
      return;
    }

     // Select a random song
     const randomIndex = Math.floor(Math.random() * songs.length);
     const randomSong = songs[randomIndex];
 
     // Play the selected random song using useOnPlaylist
     onPlay(randomSong.id);
  };

 



  return (
    <div>
      {/* Button will start playing the first song when clicked */}
      <button
        onClick={handleClick} // Trigger play when clicked
        className="rounded-full p-2 flex items-center justify-center hover:opacity-75 transition"
      >
        <CiPlay1 size={30} />
      </button>
    </div>
  );
};

export default PlaySongsFromPlaylist;
