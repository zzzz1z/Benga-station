'use client'

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react'; 
import {  Songs} from '@/types';
import './AddSongsToPlaylist.css'
import PlaylistItem from '../components/PlaylistsItem';





interface AddSongToPlaylistProps {
  playlistId?: string; 

}
const AddSongToPlaylistModal: React.FC<AddSongToPlaylistProps> =  ({
  playlistId
} ) => {

  const [songs, setSongs] = useState<Songs[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredSongs, setFilteredSongs] = useState<Songs[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);

  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data: songs, error } = await supabaseClient
          .from('Songs')
          .select('*');

        if (error) {
          throw error;
        }

        if (songs) {
          setSongs(songs);
          setFilteredSongs(songs);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    };

    fetchSongs();
  }, []);



  useEffect(() => {
    setFilteredSongs(
      songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.author.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 2) // Limita o número de sugestões exibidas para duas
    );
  }, [searchTerm, songs]);


  const handleCheckboxChange = (songId: string) => {
    const newSelected = selectedSongIds.includes(songId)
      ? selectedSongIds.filter(id => id !== songId)
      : [...selectedSongIds, songId];

    setSelectedSongIds(newSelected);
  };

  const addSongsToPlaylist = async (playlistId: string, songIds: string[]) => {
    const songsToAdd = songIds.map(songId => ({
      playlist_id: playlistId,
      song_id: songId,
    }));

    try {
      const { error } = await supabaseClient
        .from('playlist_songs')
        .insert(songsToAdd);

      if (error) {
        throw error;
      }

      console.log('Songs added to playlist successfully');
      setSelectedSongIds([]);  // Limpa as músicas selecionadas
    } catch (error) {
      console.error('Error adding songs to playlist:', error);
    }
  };


  useEffect(() => {
    if (playlistId && selectedSongIds.length > 0) {
      const createPlaylistAndAddSongs = async () => {
        try {
          const { data: existingPlaylist, error } = await supabaseClient
            .from('Playlists')
            .select('id')
            .eq('id', playlistId)
            .single();

          if (error) {
            throw error;
          }

          if (!existingPlaylist) {
            console.log('Playlist not found, creating...');

            const { data: newPlaylist, error } = await supabaseClient
              .from('Playlists')
              .insert({ id: playlistId });

            if (error) {
              throw error;
            }

            if (!newPlaylist) {
              console.error('Error: Failed to create playlist');
              return;
            }

            console.log('Playlist created successfully');

            // Agora que a playlist foi criada, adiciona as músicas
            await addSongsToPlaylist(playlistId, selectedSongIds);
          } else {
            // Se a playlist já existe, adiciona as músicas diretamente
            await addSongsToPlaylist(playlistId, selectedSongIds);
          }
        } catch (error) {
          console.error('Error creating playlist or adding songs:', error);
        }
      };

      createPlaylistAndAddSongs();
    }
  }, [playlistId, selectedSongIds]);

  
  
  

  return (
<div className="add-songs-container">
      <input
        type="text"
        placeholder="Search for songs"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul className="song-list">
        {filteredSongs.map(song => (
          <li key={song.id} className="song-item">
            <input
              type="checkbox"
              id={song.id}
              checked={selectedSongIds.includes(song.id)}
              onChange={() => handleCheckboxChange(song.id)}
            />
            <label htmlFor={song.id}>{song.title} - {song.author}</label>
          </li>
        ))}
      </ul>
    </div>

  );
}

export default AddSongToPlaylistModal;
