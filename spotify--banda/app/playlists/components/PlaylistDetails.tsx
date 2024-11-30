'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Use `useParams` for dynamic segments
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface Song {
  id: string;
  title: string;
  author: string;
}

interface Playlist {
  id: string;
  title: string;
  songs: Song[];
}

const PlaylistDetails: React.FC = () => {
  const { id } = useParams(); // Get 'id' from dynamic route
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(false);
  const supabaseClient = useSupabaseClient();

  useEffect(() => {

    if (!id) {
      console.log('Playlist ID is missing');
      return;
    }

    const fetchPlaylist = async () => {
      loading;

      try {
        console.log('Fetching playlist with ID:', id);

        const { data: playlistData, error: playlistError } = await supabaseClient
          .from('Playlists')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        console.log('Playlist Data:', playlistData, 'Error:', playlistError);
        if (playlistError) throw playlistError;

        const { data: songData, error: songError } = await supabaseClient
          .from('playlist_songs')
          .select('Songs(*)')
          .eq('playlist_id', id);

        console.log('Song Data:', songData, 'Error:', songError);
        if (songError) throw songError;

        if (playlistData && songData) {
          setPlaylist({
            ...playlistData,
            songs: songData.map((item: any) => item.songs),
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

  if (!playlist) return <div>Playlist not found</div>;

  return (




    <div>
      <h1>{playlist.title}</h1>
      <ul>
        {playlist.songs.map((song) => (
          <li key={song?.id}>
            {song?.title} - {song?.author}
          </li>
        ))}
      </ul>
    </div>






  );
};

export default PlaylistDetails;
