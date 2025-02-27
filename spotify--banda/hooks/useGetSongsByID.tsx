import { Song } from "@/types";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

const useGetSongById = (id?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const { supabaseClient } = useSessionContext();

  useEffect(() => {
    if (!id) {
      setSong(null); // Ensure song resets if no ID is provided
      return;
    }

    setIsLoading(true);

    const fetchSong = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("Songs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        setSong(data as Song);
      } catch (error: any) {
        toast.error(error.message);
        setSong(null); // Handle case where song isn't found
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [id, supabaseClient]);

  return useMemo(
    () => ({
      isLoading,
      song,
    }),
    [isLoading, song]
  );
};

export default useGetSongById;
