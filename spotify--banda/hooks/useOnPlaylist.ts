import { Song } from "@/types";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";
import useSubscribeModal from "./useSubscribeModal.ts";
import usePlayer from "./usePlayer";

const useOnPlaylist = (playlistSongs: Song[]) => {
    const player = usePlayer();
    const authModal = useAuthModal();
    const { user } = useUser();
    const subscribeModal = useSubscribeModal();

    const onPlay = (id: string) => {
        if (!user) {
            return authModal.onOpen('sign_up')
        }

        // Ensure we only set the playlist if there are valid songs
        if (playlistSongs.length === 0) {
            console.warn("No songs available in this playlist.");
            return;
        }

        player.setId(id); // Set the currently playing song
        player.setIds(playlistSongs.map((song) => song.id)); // Set the whole playlist
    };

    return onPlay;
};

export default useOnPlaylist;
