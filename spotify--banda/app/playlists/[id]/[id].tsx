import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {Song} from './[id]'
import React from 'react';




interface Playlists {
  title: string;
  songs:Song[]
}

const PlaylistPage: React.FC= () => {
  


  const router = useRouter();
  const { id } = router.query;
  const [playlist, setPlaylist] = useState<Playlists | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseClient = useSupabaseClient();

  

  useEffect(() => {
    if (id) {
      const fetchPlaylist = async () => {
        const { data, error } = await supabaseClient
          .from('playlists')
          .select('*')
          .eq('id', id)
          .single();

          if(data){
          setPlaylist(data);
          setLoading(false);
         } else {
          
          console.error('Error fetching playlist:', error);
          setLoading(false);

         }
      }

      fetchPlaylist();
    }
  }, [id]);


  if (loading) {
    console.log('Loading...')
  }

  if (!playlist) {
    console.log('Playlist not found')
  }

  return (
    <>
    <div>
      <h1>{playlist?.title}</h1>
      <ul>
        {playlist?.songs && playlist.songs.map((song, index) => (
          <li key={index}>{song.title}</li>
        ))}
      </ul>
      
     
    </div>

    
    </>
  );
}

export default PlaylistPage;