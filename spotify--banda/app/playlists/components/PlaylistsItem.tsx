'use client';

import useLoadImagePlaylist from "@/hooks/useLoadImagePlaylist";
import { Playlist } from "@/types";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const supabase = createClient();

interface PlaylistItemProps {
  data: Playlist;
  onClick?: (id: string) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ data, onClick }) => {
  const imageUrl = useLoadImagePlaylist(data);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/playlists/${data?.id}`);
    if (onClick) onClick(data.id);
  };

  const deletePlaylist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const confirmDelete = confirm(`Are you sure you want to delete "${data.title}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('Playlists').delete().eq('id', data.id);
      if (error) throw error;

      toast.success('Playlist deleted successfully.');
      router.refresh();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist. Please try again.');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-x-3 cursor-pointer hover:bg-neutral-800/50 w-full p-2 rounded-md"
    >
      <div className="relative rounded-md min-h-[48px] min-w-[48px] overflow-hidden">
        <Image
          priority
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imageUrl ?? '/images/likedit.png'}
          alt={`${data.title} Cover`}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-y-1 overflow-hidden">
        <p className="text-white truncate">{data.title}</p>
      </div>
    </div>
  );
};

export default PlaylistItem;