import { Song } from "@/types";
import usePlayer from "./usePlayer";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";
import useSubscribeModal from "./useSubscribeModal.ts";

const useOnPlay = (songs: Song[]) => {
    const player = usePlayer();
    const authModal = useAuthModal();
    const { user } = useUser();
    const subscribeModal = useSubscribeModal();

    const onPlay = (id: string) => {
        if (!user) {
            return authModal.onOpen('sign_up');
        }

        // setQueue caches the full song objects so Player.tsx can skip instantly
        // Re-order so the clicked song is first, rest follow in original order
        const clickedIndex = songs.findIndex(song => song.id === id);
        const reordered = [
            songs[clickedIndex],
            ...songs.slice(0, clickedIndex),
            ...songs.slice(clickedIndex + 1),
        ];
        player.setQueue(reordered);
    };

    return onPlay;
};

export default useOnPlay;