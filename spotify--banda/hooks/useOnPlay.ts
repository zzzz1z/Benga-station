import { Song } from "@/types";
import usePlayer from "./usePlayer";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";

export const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const preExtractSong = (videoId: string): void => {
  fetch('/api/preextract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => {});
};

const useOnPlay = (defaultSongs?: Song[]) => {
  const player = usePlayer();
  const authModal = useAuthModal();
  const { user } = useUser();

  const onPlay = (id: string, callSongs?: Song[]) => {
    if (!user) return authModal.onOpen('sign_up');

    const songs = callSongs ?? defaultSongs ?? [];
    if (!songs.length) return;
    if (player.activeID === id) return;

    const tappedSong = songs.find(s => getSongPlayerId(s) === id);

    if (tappedSong?.source === 'youtube' && tappedSong.youtube_video_id) {
      preExtractSong(tappedSong.youtube_video_id);
    }

    player.setQueue(songs, id);
  };

  return onPlay;
};

export default useOnPlay;