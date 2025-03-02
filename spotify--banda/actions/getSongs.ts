import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getSongs = async (): Promise<Song[]> => {

    
    try {
        const supabase = createServerComponentClient({ cookies: cookies });

        const { data, error } = await supabase
            .from("Songs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10); // ✅ Only fetch the first 6 songs

        if (error) {
            console.error("Erro ao buscar músicas:", error.message);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Erro inesperado ao buscar músicas:", err);
        return [];
    }
};

export default getSongs;
