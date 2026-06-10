import { useState, useEffect } from "react";
import { Song } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const useLoadSongUrl = (song: Song) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // 1. If no song exists, clear it and bail early
    if (!song?.id) {
      setUrl('');
      return;
    }

    // 2. Compute and set the URL atomically in one single state update
    if (song.source === 'youtube' && song.youtube_video_id) {
setUrl(`${process.env.NEXT_PUBLIC_API_URL}/api/youtube/stream?videoId=${song.youtube_video_id}`);
    } else if (song.song_path) {
      const { data } = supabase.storage
        .from('musicas')
        .getPublicUrl(song.song_path);
      
      if (data?.publicUrl) {
        setUrl(data.publicUrl);
      } else {
        setUrl('');
      }
    } else {
      setUrl('');
    }
  }, [song?.id, song?.source, song?.youtube_video_id, song?.song_path]);

  return url;
};

export default useLoadSongUrl;