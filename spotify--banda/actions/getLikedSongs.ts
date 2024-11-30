import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getLikedSongs = async (): Promise<Song[]> => {
    
    
    await cookies()
    const supabase = createServerComponentClient({        cookies: cookies
    });

    const {
        data: {
            user
        } 
    }= await supabase.auth.getUser();

    const { data , error } = await supabase.from('Músicas_Favoritas').select('*, Songs(*)').eq('user_id', user?.id).order('created_at', { ascending: false});

    if (error){
        console.log(error)
        return [];
    }

    if(!data){
        return [];
    }

    return data.map((item) => ({
        ...item.Songs 
    }))


};


export default getLikedSongs;