'use client'

import useLoadImage from "@/hooks/useLoadImage";
import usePlayer from "@/hooks/usePlayer";
import { Song } from "@/types";
import Image from "next/image";

interface MediaItemProps {
  data: Song;
  onClick?: (id: string) => void;
}

const MediaItem: React.FC<MediaItemProps> = ({ data, onClick }) => {  
  const imageUrl = useLoadImage(data);
  const player = usePlayer();

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
      className="flex items-center gap-3 cursor-pointer hover:bg-neutral-800/50 p-2 rounded-md w-full"
    >
      {/* Image Container */}
      <div className="relative rounded-md h-12 w-12 flex-shrink-0 overflow-hidden">
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
      <div className="flex flex-col gap-y-1 min-w-0">
        <p className="text-white truncate">{data.title}</p>
        <div className="author-name-container overflow-hidden">
          <p className="text-neutral-400 text-sm marquee">{data.author}</p>
        </div>
      </div>
    </div>
  );
};

export default MediaItem;
