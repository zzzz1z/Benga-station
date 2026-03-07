import { Song } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const useLoadSongUrl = (song: Song) => {
    if (!song) return '';

    const { data: songData } = supabase.storage.from('musicas').getPublicUrl(song.song_path);

    return songData.publicUrl;
};

export default useLoadSongUrl;