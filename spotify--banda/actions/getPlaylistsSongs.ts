import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getSongsFromPlaylist = async (playlistId: string): Promise<Song[]> => {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Assuming you have a PlaylistSongs table with playlist_id and song_id
    const { data, error } = await supabase
      .from("PlaylistSongs")
      .select("song_id") // Get song IDs from the join table
      .eq("playlist_id", playlistId); // Filter by playlist ID

    if (error) {
      console.error("Error fetching playlist songs:", error.message);
      return [];
    }

    // If no songs are found in the PlaylistSongs table, return an empty array
    if (data.length === 0) {
      return [];
    }

    // Extract the song IDs from the PlaylistSongs table result
    const songIds = data.map((entry) => entry.song_id);

    // Now, fetch the actual song data using the extracted song IDs
    const { data: songs, error: songError } = await supabase
      .from("Songs")
      .select("*")
      .in("id", songIds); // Filter songs by the IDs from PlaylistSongs

    if (songError) {
      console.error("Error fetching songs from Playlist:", songError.message);
      return [];
    }

    return songs ?? []; // Return the fetched songs or an empty array
  } catch (err) {
    console.error("Error during fetching playlist songs:", err);
    return [];
  }
};

export default getSongsFromPlaylist;
