import React from 'react';
import { CiPlay1 } from "react-icons/ci";
import { Playlist, Song } from '@/types';

import useOnPlaylist from '@/hooks/useOnPlaylist';
import usePlayer from '@/hooks/usePlayer';
import useOnPlay from '@/hooks/useOnPlay';

interface PlaySongsFromPlaylistProps {
  songs: Playlist['songs']; // Accepts a list of songs from the parent
  
}

const PlaySongsFromPlaylist: React.FC<PlaySongsFromPlaylistProps> = ({ songs }) => {


  const onPlay = useOnPlay(songs); // Hook to manage playback
  const player = usePlayer()
  
  const handleClick = () => {
    if (songs.length === 0) {
      alert('No songs available in this playlist.');
      return;
    }
  
    // Start playing from index 0
    onPlay(songs[0].id);
  
    // Set the playlist queue (assuming `setPlaylist` is available)
    player.setQueue(songs);

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
