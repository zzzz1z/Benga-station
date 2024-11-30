'use client';

import useLoadImagePlaylist from "@/hooks/useLoadImagePlaylist";
import { Playlist } from "@/types";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiDelete } from "react-icons/fi";
import toast from "react-hot-toast"; // For user feedback

interface PlaylistItemProps {
  data: Playlist;
  onClick?: (id: string) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ data, onClick }) => {
  if (!data) {
    return null; // Handle null/undefined data gracefully
  }

  const imageUrl = useLoadImagePlaylist(data); // Ensure useLoadImage fetches `cover_image`
  const router = useRouter();
  const supabaseClient = useSupabaseClient();

  const handleClick = () => {
    if (!data?.id) {
      toast.error("Playlist ID is missing. Cannot navigate.");
      return;
    }
    router.push(`/playlists/${data.id}`);
    onClick?.(data.id);
  };

  const deletePlaylist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering the `handleClick` event

    if (!data?.id) {
      toast.error("Playlist ID is missing. Cannot delete.");
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete "${data?.title ?? 'this playlist'}"?`);
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
          hover:scale-105 transition-transform duration-300 ease-in-out
          border border-gray-700 shadow-lg



        "
      >
        <Image
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imageUrl ?? '/images/likedit.png'} // Default fallback image
          alt={`${data?.title ?? 'Playlist'} Cover`}
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
        <p className="text-white truncate">{data?.title ?? 'Untitled Playlist'}</p>
      </div>

      {/* Delete Button */}
      <div className="ml-auto">
        <button
          onClick={deletePlaylist}
          className="
            text-red-500
            hover:text-red-700
            focus:outline-none
            focus:ring-2
            focus:ring-red-500
            focus:ring-opacity-50
          "
          title="Delete Playlist"
        >
          <FiDelete size={20} />
        </button>
      </div>
    </div>
  );
};

export default PlaylistItem;
