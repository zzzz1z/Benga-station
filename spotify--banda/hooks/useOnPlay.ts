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

const warmAround = (songs: Song[], activeId: string) => {
  const currentIndex = songs.findIndex(s => getSongPlayerId(s) === activeId);
  if (currentIndex === -1) return;

  const targets = [
    songs[currentIndex],
    songs[currentIndex + 1],
    songs[currentIndex + 2],
    songs[currentIndex - 1],
  ].filter((s): s is Song => !!s && s.source === 'youtube' && !!s.youtube_video_id);

  const videoIds = [...new Set(targets.map(s => s.youtube_video_id!))];
  if (!videoIds.length) return;

  fetch('/api/warm-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds }),
  }).catch(() => {});
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

    // Preextract the tapped song first — blocks until worker confirms ready
    if (tappedSong?.source === 'youtube' && tappedSong.youtube_video_id) {
      await preExtractSong(tappedSong.youtube_video_id);
    }

    // Warm neighbours fire and forget
    warmAround(songs, id);

    player.setQueue(songs, id);
  };

  return onPlay;
};

export default useOnPlay;