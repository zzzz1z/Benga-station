import { Song } from "@/types";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";
import usePlayer from "./usePlayer";

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

        // Guard: Don't reset the queue if the song is already active
        if (player.activeID === id) return;

        player.setQueue(songs, id);
    };

    return onPlay;
};

export default useOnPlaylist;