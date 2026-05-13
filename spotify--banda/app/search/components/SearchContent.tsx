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
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-600 font-mono text-xs uppercase tracking-widest">
        {">"} ERR: NO_RESULTS_FOUND_IN_DATABASE
      </div>
    );

  return (
    <div className="flex flex-col w-full px-6 gap-y-1">
      {songs.map((song) => (
        <div 
          key={song.id} 
          className="group relative border-b border-white/5 last:border-0"
        >
          {/* Subtle hover accent line */}
          <div className="absolute left-[-24px] top-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <MediaItem
            onClick={() => onPlay(getSongPlayerId(song))}
            data={song}
          />
        </div>
      ))}
    </div>
  );
};

export default SearchContent;