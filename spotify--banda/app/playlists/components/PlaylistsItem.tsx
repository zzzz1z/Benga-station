'use client';

import useLoadImagePlaylist from "@/hooks/useLoadImagePlaylist";
import { Playlist } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface PlaylistItemProps {
  data: Playlist;
  onClick?: (id: string) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ data, onClick }) => {
  const imageUrl = useLoadImagePlaylist(data); // Ensure useLoadImage fetches `cover_image`
  const router = useRouter();

  const handleClick = () => {
    // Navigate to playlist and trigger optional callback
    router.push(`/playlists/${data?.id}`);
    if (onClick) {
      onClick(data.id);
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
        fill
        src={imageUrl || '/images/likedit.png'} // Default fallback image
        alt={`${data.cover_image} Cover`}
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
