'use client';

import useLoadImagePlaylist from "@/hooks/useLoadImagePlaylist";
import { Playlist } from "@/types";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // For user feedback

interface PlaylistItemProps {
  data: Playlist;
  onClick?: (id: string) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ data, onClick }) => {
  const imageUrl = useLoadImagePlaylist(data); // Ensure useLoadImage fetches `cover_image`
  const router = useRouter();
  const supabaseClient = useSupabaseClient();

  const handleClick = () => {
    // Navigate to playlist and trigger optional callback
    router.push(`/playlists/${data?.id}`);
    if (onClick) {
      onClick(data.id);
    }
  };

  const deletePlaylist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering the `handleClick` event

    const confirmDelete = confirm(`Are you sure you want to delete "${data.title}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabaseClient
        .from('Playlists')
        .delete()
        .eq('id', data.id);

      if (error) {
        throw error;
      }

      toast.success('Playlist deleted successfully.');
      router.refresh(); // Refresh to reflect the updated list
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist. Please try again.');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="
        flex
        items-center
        gap-x-3
        cursor-pointer
        hover:bg-neutral-800/50
        w-full
        p-2
        rounded-md
      "
    >
      {/* Playlist Cover */}
      <div
        className="
          relative
          rounded-md
          min-h-[48px]
          min-w-[48px]
          overflow-hidden
        "
      >
        <Image
          priority
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imageUrl ?? '/images/likedit.png'} // Default fallback image
          alt={`${data.title} Cover`}
          className="object-cover"
        />
      </div>

      {/* Playlist Title */}
      <div
        className="
          flex
          flex-col
          gap-y-1
          overflow-hidden
        "
      >
        <p className="text-white truncate">{data.title}</p>
      </div>

    
    </div>
  );
};

export default PlaylistItem;
