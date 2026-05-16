import { Song } from "@/types";
import usePlayer from "./usePlayer";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";

export const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const preExtractSong = async (videoId: string): Promise<void> => {
  try {
    await fetch('/api/preextract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {}
};

const useOnPlay = (defaultSongs?: Song[]) => {
  const player = usePlayer();
  const authModal = useAuthModal();
  const { user } = useUser();

  const onPlay = async (id: string, callSongs?: Song[]) => {
    if (!user) return authModal.onOpen('sign_up');

    const songs = callSongs ?? defaultSongs ?? [];
    if (!songs.length) return;
    if (player.activeID === id) return;

    const tappedSong = songs.find(s => getSongPlayerId(s) === id);

    // Preextract tapped song first — with Redis URL caching this is usually
    // a cache hit and returns in < 1 second
    if (tappedSong?.source === 'youtube' && tappedSong.youtube_video_id) {
      await preExtractSong(tappedSong.youtube_video_id);
    }

    player.setQueue(songs, id);
  };

  return onPlay;
};

export default useOnPlay;