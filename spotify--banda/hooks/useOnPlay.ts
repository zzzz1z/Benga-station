import { Song } from "@/types";
import usePlayer from "./usePlayer";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";

// Shared helper — same logic used by SongItem, MediaItem, playlist rows, etc.
export const getSongPlayerId = (song: Song): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

// Warm the clicked song + its neighbours in one batch request.
// songs = the full queue context; activeId = the id the user just clicked.
const warmAround = (songs: Song[], activeId: string) => {
    const currentIndex = songs.findIndex(s => getSongPlayerId(s) === activeId);
    if (currentIndex === -1) return;

    const targets = [
        songs[currentIndex],       // the song itself (in case not yet warm)
        songs[currentIndex + 1],   // next
        songs[currentIndex + 2],   // one after
        songs[currentIndex - 1],   // previous (in case user goes back)
    ].filter((s): s is Song => !!s && s.source === 'youtube' && !!s.youtube_video_id);

    const videoIds = [...new Set(targets.map(s => s.youtube_video_id!))];
    if (videoIds.length === 0) return;

    fetch('/api/warm-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds }),
    }).catch(() => {});
};

// Merged useOnPlay + useOnPlaylist.
//
// Old useOnPlay:     const onPlay = useOnPlay(songs)  → onPlay(id)
// Old useOnPlaylist: const onPlay = useOnPlaylist()   → onPlay(id, songs)
//
// New (both patterns work):
//   const onPlay = useOnPlay()        → onPlay(id, songs)
//   const onPlay = useOnPlay(songs)   → onPlay(id)          ← backward-compatible
//
const useOnPlay = (defaultSongs?: Song[]) => {
    const player = usePlayer();
    const authModal = useAuthModal();
    const { user } = useUser();

    const onPlay = (id: string, callSongs?: Song[]) => {
        if (!user) return authModal.onOpen('sign_up');

        const songs = callSongs ?? defaultSongs ?? [];
        if (songs.length === 0) return;

        // Guard: don't restart if already the active song
        if (player.activeID === id) return;

        // Warm the clicked song + neighbours immediately — before setQueue
        // so yt-dlp starts as early as possible.
        warmAround(songs, id);

        player.setQueue(songs, id);
    };

    return onPlay;
};

export default useOnPlay;