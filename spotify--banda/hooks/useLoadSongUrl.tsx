import { useState, useEffect } from "react";
import { Song } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const useLoadSongUrl = (song: Song) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl('');
    if (!song?.id) return;

    if (song.source === 'youtube' && song.youtube_video_id) {
      setUrl(`/api/youtube/stream?videoId=${song.youtube_video_id}`);
    } else if (song.song_path) {
      const { data } = supabase.storage
        .from('musicas')
        .getPublicUrl(song.song_path);
      if (data?.publicUrl) setUrl(data.publicUrl);
    }
  }, [song?.id, song?.source, song?.youtube_video_id, song?.song_path]);

  return url;
};

export default useLoadSongUrl;