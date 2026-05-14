import { useState, useEffect } from "react";
import { Song } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { Filesystem, Directory } from '@capacitor/filesystem';

const supabase = createClient();

// Check if we're in a Capacitor native context
const isNative = () =>
  typeof (window as any).Capacitor !== 'undefined' &&
  (window as any).Capacitor.isNativePlatform();

// Try to get a local file:// URI for a cached offline song.
// Returns null if not cached or not on native.
const getOfflineUri = async (videoId: string): Promise<string | null> => {
  if (!isNative()) return null;
  try {
    const result = await Filesystem.getUri({
      path: `offline/${videoId}.m4a`,
      directory: Directory.Documents,
    });
    // Verify the file actually exists by checking the URI is non-empty
    if (result.uri) return result.uri;
    return null;
  } catch {
    // File doesn't exist — not cached
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

      // Check offline cache first (Capacitor native only)
      getOfflineUri(videoId).then(localUri => {
        if (localUri) {
          // Serve from local filesystem — no network needed
          console.log(`[useLoadSongUrl] serving ${videoId} from offline cache`);
          setUrl(localUri);
        } else {
          // Fall back to streaming via worker
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