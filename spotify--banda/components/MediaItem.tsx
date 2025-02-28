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
      className="flex items-center gap-4 cursor-pointer hover:bg-neutral-800/50 p-2 rounded-md w-full"
    >
      {/* Image Container */}
      <div className="relative rounded-md h-14 w-16 flex-shrink-0 overflow-hidden">
        <Image
          priority
          fill
          sizes="(max-width: 968px) 100vw, (max-width: 1400px) 70vw, 53vw"
          src={imageUrl ?? '/images/likedit.png'}
          alt={data.title ?? 'Media Item'}
          className="object-cover"
        />
      </div>

      {/* Text Info Section */}
      <div className="flex flex-col w-full gap-y-1 min-w-0">
        <p className="text-white truncate w-full overflow-visible">{data.title}</p>
        <div className=" overflow-hidden ">
          <p className="text-neutral-400 text-sm ">{data.author}</p>
        </div>
      </div>
    </div>
  );
};

export default MediaItem;
