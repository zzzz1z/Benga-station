import { Song } from "@/types"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient();

const useLoadImage = (song: Song) => {
    if (!song) return null;

    const { data: imageData } = supabase.storage.from('imagens').getPublicUrl(song.image_path);

    return imageData.publicUrl;
}

export default useLoadImage;