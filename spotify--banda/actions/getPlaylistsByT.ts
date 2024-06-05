import { Playlist } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import getPlaylists from "./getPlaylists";

const getPlaylistsByT = async (title: string): Promise<Playlist[]> => {
    const supabase = createServerComponentClient({        
        cookies: cookies
    });

    if (!title) {
        const allPlaylists = await getPlaylists();
        return allPlaylists
    }

    const { data, error } = await supabase.from('Playlists').select('*').ilike('title', `${title}`).order('created_at', { ascending: false});

    if (error){
        console.log(error)
    }

    return (data as any) || [];
}


export default getPlaylistsByT;