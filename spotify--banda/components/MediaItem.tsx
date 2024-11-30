'use client'

import useLoadImage from "@/hooks/useLoadImage";
import usePlayer from "@/hooks/usePlayer";
import { Song } from "@/types";
import Image from "next/image";

interface MediaItemProps {
  data: Song;
  onClick?: (id: string) => void;
}

const MediaItem: React.FC<MediaItemProps> = ({
  data,
  onClick,
}) => {
  const player = usePlayer();
  const imageUrl = useLoadImage(data);

  const handleClick = () => {
    // If onClick is passed, call it. Otherwise, set the player ID.
    if (onClick) {
      onClick(data.id);
    } else {
      player.setId(data.id); // Assuming this sets the player's current track or context.
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-x-3 cursor-pointer hover:bg-neutral-800/50 w-full p-2 rounded-md"
    >
      {/* Image Container */}
      <div className="relative rounded-md min-h-[48px] min-w-[48px] overflow-hidden">
        <Image
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imageUrl ?? '/images/likedit.png'}
          alt={data.title ?? 'Media Item'} // Improve accessibility with meaningful alt text
          className="object-cover"
        />
      </div>

      {/* Text Info Section */}
      <div className="flex items-start overflow-hidden flex-col gap-y-1">
        <p className="text-white text-wrap truncate">{data.title}</p>
        <p className="text-neutral-400 text-wrap text-sm truncate">{data.author}</p>
      </div>
    </div>
  );
};

export default MediaItem;
