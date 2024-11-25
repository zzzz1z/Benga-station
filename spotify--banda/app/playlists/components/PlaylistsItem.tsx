'use client'

import useLoadImage from "@/hooks/useLoadImage";
import usePlayer from "@/hooks/usePlayer";
import { Playlist } from "@/types";
import Image from "next/image";


interface PlaylistItemProps  {
  data: Playlist;
  onClick?: (id: string) => void
}
const PlaylistItem: React.FC<PlaylistItemProps> = ({
  data,
  onClick
}) => {

  
  const player = usePlayer();
  const imageUrl = useLoadImage(data as any);

  const handleClick = () => {
    
    if(onClick) {
      return onClick(data.id);
    }

    return player.setId(data.id)
  }

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
         src={ imageUrl || '/images/likedit.png'}
         alt="Media Item"
         className="object-cover
         "
        />
      </div>

      <div
       className="
       flex
       flex-col
       gap-y-1
       overflow-hidden
       "
      >
        <p className="text-white truncate">
          {data.title}
        </p>
       

      </div>
      
      
    </div>
  )
}

export default PlaylistItem;
