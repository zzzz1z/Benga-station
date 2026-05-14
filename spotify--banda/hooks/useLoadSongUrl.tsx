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

const getOfflineUri = async (videoId: string): Promise<string | null> => {
  if (!isNative()) return null;
  try {
    // stat() throws if file doesn't exist — getUri() does not
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