import { Song } from "@/types";
import usePlayer from "./usePlayer";
import useAuthModal from "./useAuthModal";
import { useUser } from "./useUser";
import useSubscribeModal from "./useSubscribeModal.ts";

const useOnPlay = (songs: Song[]) => {
    const player = usePlayer();
    const authModal = useAuthModal();
    const { user, } = useUser();
    const subscribeModal = useSubscribeModal();

    const onPlay = (id: string) => {
        if(!user) {
            return authModal.onOpen('sign_up')
        }

    
      

        player.setId(id);
        player.setIds(songs.map((song) => song.id))
    }

    return onPlay;
}

export default useOnPlay;