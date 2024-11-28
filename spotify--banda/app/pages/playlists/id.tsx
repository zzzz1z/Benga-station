import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React from 'react';

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

const PlaylistPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;  // Get the dynamic 'id' from the URL
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    if (!id) return;  // If 'id' is not available yet, don't fetch data

    const fetchPlaylist = async () => {
      setLoading(true);

      // Fetch the playlist details from Supabase
      const { data: playlistData, error: playlistError } = await supabaseClient
        .from('Playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (playlistError) {
        console.error('Error fetching playlist:', playlistError);
        setLoading(false);
        return;
      }

      // Fetch the songs associated with this playlist from 'playlist_songs'
      const { data: songData, error: songError } = await supabaseClient
        .from('playlist_songs')
        .select('songs(*)')
        .eq('playlist_id', id);

      if (songError) {
        console.error('Error fetching songs:', songError);
        setLoading(false);
        return;
      }

      // Update the state with playlist data and associated songs
      if (playlistData && songData) {
        setPlaylist({
          ...playlistData,
          songs: songData.map((item: any) => item.songs),
        });
      }

      setLoading(false);
    };

    fetchPlaylist();
  }, [id, supabaseClient]);  // The effect depends on 'id' and 'supabaseClient'

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!playlist) {
    return <div>Playlist not found</div>;
  }

  return (
    <div>
      <h1>{playlist.title}</h1>
      <ul>
        {playlist.songs.map((song) => (
          <li key={song.id}>
            {song.title} - {song.author}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlaylistPage;
