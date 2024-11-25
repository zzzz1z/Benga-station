'use client';

import LikedButton from "@/components/LikedButton";
import MediaItem from "@/components/MediaItem";
import useOnPlay from "@/hooks/useOnPlay";
import {  Song } from "@/types";


interface SearchContentProps {
  songs: Song[];
}


const SearchContent: React.FC<SearchContentProps> = ({
  songs
}) => {
  

  const onPlay = useOnPlay(songs);
  
  //add OnClick para tocar os counteudos que estão dentro da playlist 

  if (songs.length === 0)
    return (
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
        No Song Found.
      </div>
    );

  console.log(songs)



  return (

    <div className=" flex flex-col gap-y-2 w-full px-6">
      {songs.map((song) => (
        <div
         key={song.id}
         className="flex items-center gap-x-4 w-full" 
        >
          <div className=" flex-1">
            <MediaItem
             onClick={(id: string) => onPlay(id)}
             data={song}
            />
          </div>
          <LikedButton songId={song.id}/>
        </div>

      ))}

  

    </div>
  

    
  )
  
  
}

export default SearchContent
