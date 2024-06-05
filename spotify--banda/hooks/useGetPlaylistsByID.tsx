import { Playlist } from "@/types"
import { useSessionContext } from "@supabase/auth-helpers-react"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"

const useGetPlaylistsById = (id?: string) => {
    const [isLoading, setIsLoading] = useState(false)
    const [song, setSong] = useState<Playlist | undefined>(undefined)
    const {supabaseClient} = useSessionContext();

    useEffect(()=> {

        if (!id){
            return;
        }

        setIsLoading(true)

        const fetchPlaylist = async () => {

            const {data, error} = await supabaseClient.from('Playlists').select('*').eq('id', id).single();

            if (error){
                setIsLoading(false)
                return toast.error(error.message)
            }

            setSong(data as Playlist)
        }

        fetchPlaylist();

    }, [id, supabaseClient])

    return useMemo(()=>({
        isLoading,
        song
    }), [isLoading, song])

}

export default useGetPlaylistsById;