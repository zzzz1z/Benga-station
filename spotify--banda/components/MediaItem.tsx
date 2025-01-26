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
    if (onClick) {
      onClick(data.id);
    } else {
      player.setId(data.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-x-3 m-0 cursor-pointer hover:bg-neutral-800/50 w-80 p-2 rounded-md"
    >
      {/* Image Container */}
      <div className="relative rounded-md min-h-[48px] min-w-[48px] overflow-hidden">
        <Image
          priority
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imageUrl ?? '/images/likedit.png'}
          alt={data.title ?? 'Media Item'}
          className="object-cover"
        />
      </div>

      {/* Text Info Section */}
      <div className="flex items-start flex-col gap-y-1 w-full">
        <p className="text-white text-ellipsis overflow-hidden whitespace-nowrap">{data.title}</p>
        
        {/* Scrolling author name */}
        <div className="author-name-container overflow-hidden">
          <p className="text-neutral-400 text-sm marquee">{data.author}</p>
        </div>
      </div>
    </div>
  );
};

export default MediaItem;
