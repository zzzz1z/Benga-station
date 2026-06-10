import { useMemo } from "react";
import { Song } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const useLoadSongUrl = (song: Song) => {
  return useMemo(() => {
    if (!song?.id) return '';

    if (song.source === 'youtube' && song.youtube_video_id) {
      return `${process.env.NEXT_PUBLIC_API_URL}/api/youtube/stream?videoId=${song.youtube_video_id}`;
    }

    if (song.song_path) {
      const { data } = supabase.storage.from('musicas').getPublicUrl(song.song_path);
      return data?.publicUrl ?? '';
    }

    return '';
  }, [song?.id, song?.source, song?.youtube_video_id, song?.song_path]);
};

export default useLoadSongUrl;