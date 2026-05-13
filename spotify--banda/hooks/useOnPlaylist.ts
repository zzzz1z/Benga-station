import { Song } from "@/types";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";
import usePlayer from "./usePlayer";

const WORKER_URL = process.env.NEXT_PUBLIC_YT_WORKER_URL;
const WORKER_SECRET = process.env.NEXT_PUBLIC_WORKER_SECRET;

const preExtract = (videoId: string) =>
  fetch('/api/preextract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  }).catch(() => {});

const useOnPlaylist = () => {
    const player = usePlayer();
    const authModal = useAuthModal();
    const { user } = useUser();

    const onPlay = (id: string, songs: Song[]) => {
        if (!user) {
            return authModal.onOpen('sign_up');
        }

        if (songs.length === 0) {
            console.warn("No songs available in this playlist.");
            return;
        }

        // Find the tapped song's index so we can warm it + neighbors
        const tappedIndex = songs.findIndex(s => {
            const pid = s.source === 'youtube' && s.youtube_video_id
                ? `yt_${s.youtube_video_id}`
                : String(s.id);
            return pid === id;
        });

        // Pre-extract: tapped song first (priority), then ±2 neighbors
        const indicesToWarm = [
            tappedIndex,
            tappedIndex + 1,
            tappedIndex + 2,
            tappedIndex - 1,
        ].filter(i => i >= 0 && i < songs.length);

        // Deduplicate
        const seen = new Set<number>();
        indicesToWarm
            .filter(i => { if (seen.has(i)) return false; seen.add(i); return true; })
            .forEach(i => {
                const song = songs[i];
                if (song?.source === 'youtube' && song.youtube_video_id) {
                    preExtract(song.youtube_video_id);
                }
            });

        player.setQueue(songs, id);
    };

    return onPlay;
};

export default useOnPlaylist;