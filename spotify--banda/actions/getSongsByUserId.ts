import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getSongsByUserId = async (): Promise<Song[]> => {
    const supabase = createServerComponentClient({        
        cookies: cookies
    });

    const { data: {user} } = await supabase.auth.getUser();
    
  

    
    
    
    const { data, error } = await supabase.from('Songs').select('*').eq('user_id', user?.id).order('created_at', { ascending: false});


    if (error){
        console.log(error)
    }
    

    return (data as any) || [];
}


export default getSongsByUserId;