'use client'

import { Playlist } from "@/types";
import Button from "@/components/Botão";
import useAuthModal from "@/hooks/useAuthModal";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import { useUser } from "@/hooks/useUser";
import PlaylistItem from "./PlaylistsItem";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


interface LikedPlaylistsProps {
    playlists: Playlist[];
}

const LikedPlaylists: React.FC<LikedPlaylistsProps> = ({
    playlists

}) => {

    
    const { user, isLoading} = useUser();
    const authModal = useAuthModal();
    const playlistModal = usePlaylistModal();
    const router = useRouter()


    useEffect(()=>{


      if(!isLoading && !user) {
          router.replace('/')
      }


  }, [isLoading, user, router])


    


    const onClick = () => {
        if (!user) {
          return authModal.isOpen === true;
        }
    
        return playlistModal.onClose;

        
    }

    const onPlaylistClick = (playlistId: string) => {
      router.push(`/playlists/${playlistId}`);
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
