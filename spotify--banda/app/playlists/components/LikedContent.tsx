'use client'

import { Playlist } from "@/types";
import Button from "@/components/Botão";
import useAuthModal from "@/hooks/useAuthModal";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import useSubscribeModal from "@/hooks/useSubscribeModal.ts";
import { useUser } from "@/hooks/useUser";
import AddButton from "./AddButton";
import PlaylistItem from "./PlaylistsItem";


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


    


    const onClick = () => {
        if (!user) {
          return authModal.onOpen();
        }
    
        if(!subscription){
          return subscribeModal.onOpen();
        }
    
        return playlistModal.onOpen();

        
    }

    
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
               onClick={() =>{}}
               data={playlist}
            />
        </div>
                    
        <div><AddButton playlistId={playlist.id}/></div>

        </div>
      ))}
        

          

    </div>

  )
  
}

export default LikedPlaylists;
