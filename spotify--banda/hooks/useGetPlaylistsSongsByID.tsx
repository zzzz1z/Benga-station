import { Playlist, Song } from "@/types";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const useGetPlaylistsSongsById = (id?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | undefined>(undefined);
  const { supabaseClient } = useSessionContext();

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);

    const fetchPlaylist = async () => {
      const { data, error } = await supabaseClient
        .from("Playlists")
        .select("*, songs:songs(*)") // Fetch playlist and related songs
        .eq("id", id)
        .single();

      if (error) {
        setIsLoading(false);
        return toast.error(error.message);
      }

      setPlaylist(data as Playlist);
      setIsLoading(false);
    };

    fetchPlaylist();
  }, [id, supabaseClient]);

  return useMemo(
    () => ({
      isLoading,
      playlist,
      songs: playlist?.songs || [], // Extract songs from the fetched playlist
    }),
    [isLoading, playlist]
  );
};

export default useGetPlaylistsSongsById;
