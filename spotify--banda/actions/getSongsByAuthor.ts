import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getSongsByAuthor = async (author: string): Promise<Song[]> => {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from('Songs') // Replace 'Songs' with your table name
    .select('*') // Ensure you're selecting all fields
    .ilike('author', `%${author}%`) // Perform a case-insensitive search for the author
    .order('created_at', { ascending: false }) // You can adjust the ordering based on your needs
    .limit(1000); // Set a high limit to ensure you fetch more songs (or remove if no limit)

  if (error) {
    console.error("Error fetching songs by author:", error);
    return [];
  }

  return (data as Song[]) ?? [];
};

export default getSongsByAuthor;
