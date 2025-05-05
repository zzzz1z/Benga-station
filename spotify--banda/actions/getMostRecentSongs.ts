import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getRandomSongs = async (): Promise<Song[]> => {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("Songs")
      .select("*")
      .limit(50) // Get a larger pool for better randomness
      .order("created_at", { ascending: false }); // Consistent order

    if (error || !data) {
      console.error("Erro ao buscar músicas:", error?.message);
      return [];
    }

    // Shuffle server-side (safe for SSR)
    const shuffled = [...data].sort(() => 0.5 - Math.random());

    // Return first 16 shuffled
    return shuffled.slice(0, 16);
  } catch (err) {
    console.error("Erro inesperado ao buscar músicas:", err);
    return [];
  }
};

export default getRandomSongs;
