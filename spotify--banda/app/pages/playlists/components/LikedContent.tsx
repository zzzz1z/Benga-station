'use client'

import { Playlist } from "@/types";
import Button from "@/components/Botão";
import useAuthModal from "@/hooks/useAuthModal";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import useSubscribeModal from "@/hooks/useSubscribeModal.ts";
import { useUser } from "@/hooks/useUser";
import PlaylistItem from "./PlaylistsItem";
import { useRouter } from "next/navigation";


interface LikedPlaylistsProps {
    playlists: Playlist[];
}

const LikedPlaylists: React.FC<LikedPlaylistsProps> = ({
    playlists

}) => {

    
    const { user, subscription} = useUser();
    const authModal = useAuthModal();
    const subscribeModal = useSubscribeModal();
    const playlistModal = usePlaylistModal();
    const router = useRouter()


    


    const onClick = () => {
        if (!user) {
          return authModal.onOpen();
        }
    
        return playlistModal.onOpen();

        
    }

    const onPlaylistClick = (playlistId: string) => {
      router.push(`pages/playlists/${playlistId}`);
  };

    
  return (
    <div className="flex flex-col gap-y-2 w-full p-6">

       <Button
             onClick={onClick}>
                Criar Playlist
        </Button>

        

     {playlists.map((playlist)=>
        (
        <div
            key={playlist.id}
            className="flex items-center gap-x-4 w-full"
            >

           <div className="flex-1">
             <PlaylistItem 
               onClick={onPlaylistClick}
               data={playlist}
            />
        </div>
                    
      

        </div>
      ))}
        

          

    </div>

  )
  
}

export default LikedPlaylists;
