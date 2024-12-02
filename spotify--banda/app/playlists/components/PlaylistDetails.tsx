'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Use `useParams` for dynamic segments
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import Header from '@/components/Header';
import Image from 'next/image';
import { Song } from '@/types';
import MediaItem from '@/components/MediaItem';



interface Playlist {
  id: string;
  title: string;
  songs: Song[];
  cover_image: string;
}

const PlaylistDetails: React.FC = () => {
  const { id } = useParams(); // Get 'id' from dynamic route
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseClient = useSupabaseClient();





  useEffect(() => {
  
    if(!id){
      setLoading(false)
    }

    const fetchPlaylist = async () => {
      setLoading(true);
    
      try {
        console.log('Fetching playlist with ID:', id);
    
        const { data: playlistData, error: playlistError } = await supabaseClient
          .from('Playlists')
          .select('*')
          .eq('id', id)
          .maybeSingle();
    
        if (playlistError) throw playlistError;
    
        const { data: songData, error: songError } = await supabaseClient
          .from('playlist_songs')
          .select('Songs(*)') // Ensure 'Songs' matches your actual relation name
          .eq('playlist_id', id);
    
        if (songError) throw songError;
    
        if (playlistData && songData) {
          setPlaylist({
            ...playlistData,
            songs: songData.map((item: any) => item.Songs), // Adjust mapping as per actual structure
          });
        }
      } catch (error) {
        console.error('Error fetching playlist or songs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id, supabaseClient]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-white">Lista de reprodução não encontrada</p>
      </div>
    );
  }

  return (

    <div className="
    bg-neutral-900
    rounded-lg
    h-full
    w-full
    overflow-hidden
    overflow-y-auto"
    >
     <Header>
        <div className="mt20">
            <div
             className="
             flex
             flex-col
             md:flex-row
             items-center
             gap-x-5
             "
            >
                <div
                className="
                relative
                h-32
                w-32
                lg:h-44
                lg:w-44"
                >
                    <Image
                     fill
                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                     alt='Lista de Músicas'
                     className="object-cover"
                     src= {`${playlist.cover_image}`}
                     priority
                     
                    />

                </div>
                <div className="
                flex
                flex-col
                gap-y-2
                mt-4
                md:mt-0"
                >
                    <h1
                    className="
                    text-white
                    text-4xl
                    sm:text-5xl
                    lg:text-7xl
                    font-bold
                    ">
                      {playlist.title}
                    </h1>
                </div>

            </div>
        </div>
       

     </Header>
     
     <div>

      <ul>

     

        {playlist.songs.map((song) => (
          <MediaItem
           key={song.id}
           data={song}
          
          />
         
        ))}
      </ul>
    </div>


    
     </div>


















    






  );
};

export default PlaylistDetails;
