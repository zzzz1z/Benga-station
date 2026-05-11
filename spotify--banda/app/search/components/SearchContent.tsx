'use client';

import MediaItem from "@/components/MediaItem";
import useOnPlay from "@/hooks/useOnPlay";
import { Song } from "@/types";

interface SearchContentProps {
  songs: Song[];
}

const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const SearchContent: React.FC<SearchContentProps> = ({ songs }) => {
  const onPlay = useOnPlay(songs);

  if (songs.length === 0)
    return (
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
        No Song Found.
      </div>
    );

  return (
    <div className="flex flex-col gap-y-2 w-full px-6">
      {songs.map((song) => (
        <MediaItem
          key={song.id}
          onClick={() => onPlay(getSongPlayerId(song))}
          data={song}
        />
      ))}
    </div>
  );
};

export default SearchContent;