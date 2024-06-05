import { Playlist } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getPlaylistsByUserId = async (): Promise<Playlist[]> => {
    const supabase = createServerComponentClient({        
        cookies: cookies
    });

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if(sessionError){
        console.log(sessionError.message);
        return [];
    } 

    
    
    
    const { data, error } = await supabase.from('Playlists').select('*').eq('user_id', sessionData.session?.user.id).order('created_at', { ascending: false});


    if (error){
        console.log(error)
    }
    

    return (data as any) || [];
}


export default getPlaylistsByUserId;