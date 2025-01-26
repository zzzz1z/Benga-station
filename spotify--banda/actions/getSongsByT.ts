import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import getSongs from "./getSongs";

const getSongsByT = async (search: string): Promise<Song[]> => {
    const supabase = createServerComponentClient({
        cookies: cookies
    });

    // If no search term is provided, return all songs
    if (!search) {
        const allSongs = await getSongs();
        return allSongs;
    }

    // Query songs by title or author using Supabase's `or` operator
    const { data, error } = await supabase
        .from('Songs')
        .select('*')
        .or(`title.ilike.%${search}%,author.ilike.%${search}%`) // Search for matches in title or author
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching songs by title/author:', error);
        return [];
    }

    return (data as Song[]) ?? [];
};

export default getSongsByT;
