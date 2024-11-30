import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";
import getSongs from "./getSongs";

const getSongsByT = async (title: string): Promise<Song[]> => {
    
    await cookies()
    const supabase = createServerComponentClient({        
        cookies: cookies
    });

    if (!title) {
        const allSongs = await getSongs();
        return allSongs
    }

    const { data, error } = await supabase.from('Songs').select('*').ilike('title', `${title}`).order('created_at', { ascending: false});
    
    console.log(data)
    if (error){
        console.log(error)
    }

    return (data as any) ?? [];
}


export default getSongsByT;