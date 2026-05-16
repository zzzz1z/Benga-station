import { useState, useEffect } from "react";
import { Song } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const useLoadSongUrl = (song: Song) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl('');
    if (!song?.id) return;

    let cancelled = false;

    if (song.source === 'youtube' && song.youtube_video_id) {
      fetch(`/api/youtube/stream?videoId=${song.youtube_video_id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!cancelled && data?.url) setUrl(data.url);
        })
        .catch(() => {});
    } else if (song.song_path) {
      const { data } = supabase.storage
        .from('musicas')
        .getPublicUrl(song.song_path);
      if (data?.publicUrl) setUrl(data.publicUrl);
    }

    return () => { cancelled = true; };
  }, [song?.id, song?.source, song?.youtube_video_id, song?.song_path]);

  return url;
};

export default useLoadSongUrl;