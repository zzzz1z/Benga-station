'use client';

import { Song } from "@/types";
import SongItem from "@/components/SongItem";
import useOnPlay from "@/hooks/useOnPlay";
import { useMemo } from "react";

interface AddContentProps {
  songs: Song[];
}

const AddContent: React.FC<AddContentProps> = ({ songs }) => {
  const onPlay = useOnPlay(songs);

    // Pick 6 random songs from the full list for display
  // but pass the full list to useOnPlay so the queue has all songs
const displayed = useMemo(() => 
  [...songs].sort(() => Math.random() - 0.5).slice(0, 6),
  [] // empty deps = only runs once on mount
);

  if (songs.length === 0) {
    return (
      <div className="mt-4 text-neutral-400">
        Nenhuma música disponível
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4 mt-4">
      {displayed.map((item) => (
        <SongItem
          key={item.id}
          onClick={(id: string) => onPlay(id)}
          data={item}
        />
      ))}
    </div>
  );
};

export default AddContent;