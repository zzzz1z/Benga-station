'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Songs } from '@/types';
import './AddSongsToPlaylist.css';
import MediaItem from '@/components/MediaItem';
import { useUser } from '@/hooks/useUser';

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
  const {user} = useUser()

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
    setSelectedSongIds((prevSelected) =>
      prevSelected.includes(songId)
        ? prevSelected.filter((id) => id !== songId)
        : [...prevSelected, songId]
    );
  };

  const handleAddSongs = async () => {
    if (!playlistId || selectedSongIds.length === 0) {
      alert('Select at least one song to add to the playlist.');
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
      alert('Songs added to playlist!');
    } catch (error) {
      console.error('Error adding songs:', error);
      alert('Failed to add songs. Please try again.');
    }
  };

  return (
    <div className="add-songs-container">
      <input
        type="text"
        placeholder="Search for a song"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <ul className="song-list">
        {isLoading ? (
          <p>Loading songs...</p>
        ) : filteredSongs.length > 0 ? (
          filteredSongs.map((song) => (
            <li key={song.id} className="song-item">
              <MediaItem data={song} />
              <label>
                <input
                  type="checkbox"
                  checked={selectedSongIds.includes(song.id)}
                  onChange={() => handleCheckboxChange(song.id)}
                />
                Add to Playlist
              </label>
            </li>
          ))
        ) : (
          <p>No songs found.</p>
        )}
      </ul>

      <button
        onClick={handleAddSongs}
        disabled={selectedSongIds.length === 0}
        className="add-songs-button"
      >
        Add Selected Songs
      </button>
    </div>
  );
};

export default AddSongToPlaylistModal;
