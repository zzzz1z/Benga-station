import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies  } from "next/headers";

const getSongs = async (): Promise<Song[]> => {
    
    await cookies()
    const supabase = createServerComponentClient({        cookies: cookies
    });

    const { data, error } = await supabase.from('Songs').select('*').order('created_at', { ascending: false});

    if (error){
        console.log(error)
    }

    return (data as any) ?? [];
}


export default getSongs;