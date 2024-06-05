'use client'

import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdOutlineBookmarkAdded,MdBookmarkAdded  } from "react-icons/md";


interface AddButtonProps {
    playlistId: string;
}

const AddButton: React.FC<AddButtonProps> = ({
    playlistId
}) => {

    const router = useRouter();
    const { supabaseClient } = useSessionContext();

    const authModal = useAuthModal();
    const { user } = useUser();

    const [isAdded, setIsAdded] = useState(false);


    useEffect(()=> {
        if(!user?.id) {
            return;
        }

        const fetchData = async () => {
            const { data, error } = await supabaseClient.from('Playlists_Favoritas').select('*').eq('user_id', user.id).eq('playlist_id', playlistId).single();

            if(!error && data){
                setIsAdded(true)

            }
        };

        fetchData();
    }, [playlistId, supabaseClient, user?.id])

    const Icon = isAdded ? MdBookmarkAdded : MdOutlineBookmarkAdded

    const handleClick = async () => {
        if(!user) {
            return authModal.onOpen();
        }

        if(isAdded){

            const {error} = await supabaseClient
            .from('Playlists_Favoritas')
            .delete()
            .eq('user_id', user.id)
            .eq('playlist_id', playlistId);

            if(error){
                toast.error(error.message)
            } else {
                setIsAdded(false)
            }

        } else {
            const {error} = await supabaseClient.from('Playlists_Favoritas').insert({
                playlist_id: playlistId,
                user_id: user.id
            });

            if(error){
                toast.error(error.message)
            } else { 

                setIsAdded(true)
                toast.success('Playlist adicionada aos favoritos!');
            }
        }

        router.refresh();


    }

  return (
    <button
     onClick={handleClick}
     className="
     hover:opacity-75
     transition
     "
     >
      <Icon color={isAdded ? '#A52A2A' : 'white'} size={25}/>
    </button>

  )
}

export default AddButton;
