'use client';

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Song } from "@/types";
import SongItem from "@/components/SongItem";
import useOnPlay from "@/hooks/useOnPlay";

const AddContent = () => {
  const supabase = useSupabaseClient();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const onPlay = useOnPlay(songs);

  useEffect(() => {
    const fetchSongs = async () => {
      const { data, error } = await supabase.from('Songs').select("*");

      if (error) {
        console.error("Error fetching songs:", error.message);
      } else {
        setSongs(data as Song[]);
      }

      setLoading(false);
    };

    fetchSongs();
  }, [supabase]);

  if (loading) {
    return (
      <div className="mt-4 text-neutral-400">
        Carregando músicas...
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="mt-4 text-neutral-400">
        Nenhuma música disponível
      </div>
    );
  }

  return (
    <div
      className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
        2xl:grid-cols-8
        gap-4
        mt-4
      "
    >
      {songs.map((item) => (
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
