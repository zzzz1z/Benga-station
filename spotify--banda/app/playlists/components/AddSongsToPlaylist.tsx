'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Songs } from '@/types';
import './AddSongsToPlaylist.css';
import MediaItem from '@/components/MediaItem';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';

interface AddSongToPlaylistProps {
  playlistId: string; // Required to ensure a valid playlist context
}

const AddSongToPlaylistModal: React.FC<AddSongToPlaylistProps> = ({ playlistId }) => {
  const [songs, setSongs] = useState<Songs[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredSongs, setFilteredSongs] = useState<Songs[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const supabaseClient = useSupabaseClient();
  const { user } = useUser();

  // Fetch all songs from the database
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const { data: songs, error } = await supabaseClient.from('Songs').select('*');

        if (error) {
          throw error;
        }

        setSongs(songs || []);
        setFilteredSongs(songs || []);
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [supabaseClient]);

  // Filter songs based on the search term
  useEffect(() => {
    setFilteredSongs(
      songs.filter((song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, songs]);

  const handleCheckboxChange = (songId: string) => {
    // Update the selectedSongIds array based on whether the song is selected or not
    setSelectedSongIds((prevSelected) =>
      prevSelected.includes(songId)
        ? prevSelected.filter((id) => id !== songId) // Remove if already selected
        : [...prevSelected, songId] // Add if not selected
    );
  };

  const handleAddSongs = async () => {
    // Check if there are any songs selected
    if (selectedSongIds.length === 0) {
      alert('Select at least one song to add to the playlist.');
      return;
    }

    if (!playlistId) {
      alert('Playlist ID is missing');
      return;
    }

    try {
      const songsToAdd = selectedSongIds.map((songId) => ({
        playlist_id: playlistId,
        song_id: songId, 
        user_id: user?.id
      }));

      const { error } = await supabaseClient.from('playlist_songs').insert(songsToAdd);

      if (error) {
        throw error;
      }

      console.log('Songs added successfully.');
      setSelectedSongIds([]); // Clear selected songs after adding
      toast('Músicas adicionadas à playlist');
    } catch (error) {
      console.error('Error adding songs:', error);
      alert('Houve um erro ao tentar adicionar as músicas, por favor tente outra vez.');
    }
  };

  return (
    <div className="add-songs-container">
      <input
        type="text"
        placeholder="pesquisar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <ul className="song-list overflow-hidden">
      {isLoading && <p>Loading songs...</p>}

      {!isLoading && filteredSongs.length === 0 && <p>Nenhuma música encontrada</p>}

      {!isLoading && filteredSongs.length > 0 && (
      filteredSongs.map((song) => (
      <li key={song.id} className="flex m-0 items-center">
      <div className="flex-grow">
        <MediaItem data={song} />
      </div>
      <label className="m-auto w-20">
        <input
          type="checkbox"
          checked={selectedSongIds.includes(song.id)}
          onChange={() => handleCheckboxChange(song.id)}
        />
      </label>
    </li>
  ))
)}
      </ul>

      <button
        onClick={handleAddSongs}
        disabled={selectedSongIds.length === 0}
        className="add-songs-button"
      >
        Adicionar músicas selecionadas
      </button>
    </div>
  );
};

export default AddSongToPlaylistModal;
