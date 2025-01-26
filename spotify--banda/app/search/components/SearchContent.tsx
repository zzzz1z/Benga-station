'use client';

import LikedButton from "@/components/LikedButton";
import MediaItem from "@/components/MediaItem";
import useOnPlay from "@/hooks/useOnPlay";
import { Song } from "@/types";

interface SearchContentProps {
  songs: Song[];
  authorSongs: Song[]; // Add a new prop to handle songs by the searched author
}

const SearchContent: React.FC<SearchContentProps> = ({ songs, authorSongs }) => {
  const onPlay = useOnPlay([...songs, ...authorSongs]); // Include all songs in the `useOnPlay` handler

  if (songs.length === 0 && authorSongs.length === 0)
    return (
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
        No Song Found.
      </div>
    );

  console.log(songs, authorSongs);

  return (
    <div className="flex flex-col gap-y-2 w-full px-6">
      {/* Render songs by the author */}
      {authorSongs.map((song) => (
        <div key={song.id} className="flex items-center gap-x-4 w-full">
          <div className="flex-1">
            <MediaItem onClick={(id: string) => onPlay(id)} data={song} />
          </div>
          <LikedButton songId={song.id} />
        </div>
      ))}
    </div>
  );
};

export default SearchContent;
