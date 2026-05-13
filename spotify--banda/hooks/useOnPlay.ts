import { Song } from "@/types";
import usePlayer from "./usePlayer";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";

const getSongPlayerId = (song: Song): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const preExtract = (videoId: string) => {
    fetch('/api/preextract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
    }).catch(() => {});
};

const useOnPlay = (songs: Song[]) => {
    const player = usePlayer();
    const authModal = useAuthModal();
    const { user } = useUser();

    const onPlay = (id: string) => {
        if (!user) return authModal.onOpen('sign_up');

        // Guard: Don't restart or re-extract if already playing
        if (player.activeID === id) return;

        const song = songs.find(s => getSongPlayerId(s) === id);
        if (song?.source === 'youtube' && song.youtube_video_id) {
            preExtract(song.youtube_video_id);
        }

        player.setQueue(songs, id);
    };

    return onPlay;
};

export default useOnPlay;