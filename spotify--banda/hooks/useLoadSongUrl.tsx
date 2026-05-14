import { useState, useEffect } from "react";
import { Song } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { Filesystem, Directory } from '@capacitor/filesystem';

const supabase = createClient();

const isNative = () =>
  typeof (window as any).Capacitor !== 'undefined' &&
  (window as any).Capacitor.isNativePlatform();

const getOfflineUri = async (videoId: string): Promise<string | null> => {
  if (!isNative()) return null;
  try {
    await Filesystem.stat({
      path: `offline/${videoId}.m4a`,
      directory: Directory.Documents,
    });
    const result = await Filesystem.getUri({
      path: `offline/${videoId}.m4a`,
      directory: Directory.Documents,
    });
    return result.uri || null;
  } catch {
    return null;
  }
};

const useLoadSongUrl = (song: Song) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl('');

    if (!song?.id) return;

    if (song.source === 'youtube' && song.youtube_video_id) {
      const videoId = song.youtube_video_id;

      getOfflineUri(videoId).then(localUri => {
        if (localUri) {
          console.log(`[useLoadSongUrl] serving ${videoId} from offline cache`);
          setUrl(localUri);
        } else {
          setUrl(`/api/youtube/stream?videoId=${videoId}`);
        }
      });
    } else if (song.song_path) {
      const { data } = supabase.storage
        .from('musicas')
        .getPublicUrl(song.song_path);

      if (data?.publicUrl) {
        setUrl(data.publicUrl);
      }
    }
  }, [song?.id, song?.source, song?.youtube_video_id, song?.song_path]);

  return url;
};

export default useLoadSongUrl;