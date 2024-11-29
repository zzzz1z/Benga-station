import { Playlist } from "@/types";

const useLoadImage = (data: Playlist) => {
  if (!data || !data.cover_image) {
    return null; // Return null if no cover_image is present
  }

  // Check if the `cover_image` is already a full URL
  if (data.cover_image.startsWith('http')) {
    return data.cover_image; // Use it as-is
  }

  // Construct the full URL only if `cover_image` is a relative path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/playlist-covers/${data.cover_image}`;
};

export default useLoadImage;
