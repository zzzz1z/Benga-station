import React from 'react';
import { CiPlay1 } from "react-icons/ci";
import { Song } from '@/types';
import usePlayer from '@/hooks/usePlayer';
import toast from 'react-hot-toast';

interface PlaySongsFromPlaylistProps {
  songs: Song[];
}

const getSongPlayerId = (song: Song): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const PlaySongsFromPlaylist: React.FC<PlaySongsFromPlaylistProps> = ({ songs }) => {
  const player = usePlayer();

  const handleClick = () => {
    if (songs.length === 0) {
      toast.error('Esta playlist não tem músicas.');
      return;
    }

    player.setQueue(songs, getSongPlayerId(songs[0]));
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