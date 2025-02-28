import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getRandomSongs = async (): Promise<Song[]> => {
    try {
        const supabase = createServerComponentClient({ cookies: cookies });

        const { data, error } = await supabase
            .from("Songs")
            .select("*")
            .limit(16) // Optional: Adjust the limit as needed
            .order("created_at"); // Fetch normally first

        if (error) {
            console.error("Erro ao buscar músicas:", error.message);
            return [];
        }

        // Shuffle the songs locally
        const shuffledSongs = data.toSorted(() => Math.random() - 0.5);

        return shuffledSongs;
    } catch (err) {
        console.error("Erro inesperado ao buscar músicas:", err);
        return [];
    }
};

export default getRandomSongs;
