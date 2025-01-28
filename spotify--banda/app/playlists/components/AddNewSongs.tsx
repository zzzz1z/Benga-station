'use client';

import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Button from '@/components/Botão';
import { Song } from '@/types';
import ModalToAddNewSongs from './ModalToAddNewSongs';
import MediaItem from '@/components/MediaItem';

interface AddNewSongsProps {
  playlistId: string;
  refreshPlaylist: () => void;
}

const AddNewSongs: React.FC<AddNewSongsProps> = ({ playlistId, refreshPlaylist }) => {
  const supabaseClient = useSupabaseClient();
  const [isOpen, setIsOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [playlistSongs, setPlaylistSongs] = useState<Set<string>>(new Set());
  const [warning, setWarning] = useState<string | null>(null); // New state for warning message
  const [searchTerm, setSearchTerm] = useState('');
  const user = useUser();

  // Fetch all available songs
  const fetchSongs = async () => {
    const { data, error } = await supabaseClient.from('Songs').select('*');
    if (error) {
      console.error('Error fetching songs:', error);
    } else {
      setSongs(data || []);
    }
  };

  // Fetch the songs already in the playlist
  const fetchPlaylistSongs = async () => {
    const { data, error } = await supabaseClient
      .from('playlist_songs')
      .select('song_id')
      .eq('playlist_id', playlistId);

    if (error) {
      console.error('Error fetching playlist songs:', error);
    } else {
      const playlistSongIds = new Set(data?.map((item: { song_id: string }) => item.song_id));
      setPlaylistSongs(playlistSongIds);  // Set playlist songs properly
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSongs();
      fetchPlaylistSongs();
    }
  }, [isOpen]);

  // Filter songs based on search term
  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle checkbox change
  const handleCheckboxChange = (songId: string) => {
    // Allow selection of the song, even if it's already in the playlist
    setSelectedSongs((prev) => {
      const updatedSet = new Set(prev);
      if (updatedSet.has(songId)) {
        updatedSet.delete(songId); // Uncheck if already selected
      } else {
        updatedSet.add(songId); // Check if not selected
      }
      return updatedSet;
    });

    // After selection, check if the song is already in the playlist
    if (playlistSongs.has(songId)) {
      // Show warning if the song is already in the playlist
      setWarning('Essa música já se encontra na playlist atual!!!');
      
      // Unselect the song immediately if it's already in the playlist
      setSelectedSongs((prev) => {
        const updatedSet = new Set(prev);
        updatedSet.delete(songId); // Uncheck the box
        return updatedSet;
      });

      // Remove warning after 4 seconds
      setTimeout(() => {
        setWarning(null);
      }, 4000); // 4 seconds delay
    } else {
      // Clear warning if the song is not in the playlist
      setWarning(null);
    }
  };

  // Add selected songs to the playlist
  const handleAddSongs = async () => {
    try {
      const selectedSongsArray = Array.from(selectedSongs);

      const updates = selectedSongsArray.map((songId) => ({
        user_id: user.id,
        playlist_id: playlistId,
        song_id: songId,
      }));

      const { error } = await supabaseClient.from('playlist_songs').insert(updates);
      if (error) throw error;

      setIsOpen(false); // Close the modal
      setSelectedSongs(new Set()); // Clear selected songs
      refreshPlaylist(); // Refresh the parent playlist
    } catch (error) {
      console.error('Error adding songs to playlist:', error);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>+</Button>

      <ModalToAddNewSongs 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Adicionar músicas à Playlist">
        
        <div className="flex flex-col gap-2">
          {/* Search input */}
          <input
            type="text"
            placeholder="Pesquisar..."
            className="p-2 mb-4 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Warning message */}
          {warning && <p className="text-red-500 text-sm">{warning}</p>}

          {/* Song list with checkboxes */}
          <div className="max-h-60 overflow-y-auto">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-2"
              >
                <MediaItem data={song} />

                <input
                  type="checkbox"
                  id={`song-${song.id}`}
                  checked={selectedSongs.has(song.id)}
                  onChange={() => handleCheckboxChange(song.id)}
                  // Disable checkbox if the song is already in the playlist
                />
                {selectedSongs.has(song.id) && <span>✔</span>}
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleAddSongs} className="mt-4">
          Add to Playlist
        </Button>
      </ModalToAddNewSongs>
    </>
  );
};

export default AddNewSongs;
