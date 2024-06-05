'use client';

import AddButton from "@/app/playlists/components/AddButton";
import PlaylistItem from "@/app/playlists/components/PlaylistsItem";
import LikedButton from "@/components/LikedButton";
import MediaItem from "@/components/MediaItem";
import useOnPlay from "@/hooks/useOnPlay";
import { Playlist, Song } from "@/types";


interface SearchContentProps {
  songs: Song[];
  playlists: Playlist[];
}


const SearchContent: React.FC<SearchContentProps> = ({
  songs,
  playlists
}) => {

  const onPlay = useOnPlay(songs);
  
  //add OnClick para tocar os counteudos que estão dentro da playlist 

  if (songs.length === 0 && playlists.length === 0) {
    return (
     <div
      className="
       flex
       flex-col
       gap-y-2
       w-full
       px-6
       text-neutral-400"
      >

        Não encontramos nada que corresponda a sua pesquisa ✖︎
       
     </div>
    )
  }





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

     {playlists.map((playlist) => (
        <div
         key={playlist.id}
         className="flex items-center gap-x-4 w-full" 
        >
          <div className=" flex-1">
            <PlaylistItem
             onClick={(id: string) => onPlay(id)}
             data={playlist}
            />
          </div>
          <AddButton playlistId={playlist.id}/>
        </div>

      ))}

    </div>
  

    
  )
  
  
}

export default SearchContent
