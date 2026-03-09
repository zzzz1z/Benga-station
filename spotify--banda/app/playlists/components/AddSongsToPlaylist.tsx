'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import './AddSongsToPlaylist.css';
import MediaItem from '@/components/MediaItem';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import { Song } from '@/types';
import { useRouter } from 'next/navigation';


const supabase = createClient();

interface AddSongToPlaylistProps {
  playlistId: string;
  onClose?: () => void;
}

const AddSongToPlaylistModal: React.FC<AddSongToPlaylistProps> = ({ playlistId, onClose }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('Songs').select('*');
        if (error) throw error;
        setSongs(data || []);
        setFilteredSongs(data || []);
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSongs();
  }, []);

  useEffect(() => {
    setFilteredSongs(
      songs.filter((song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, songs]);

  const handleCheckboxChange = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleAddSongs = async () => {
    if (selectedSongIds.length === 0) {
      toast('Select at least one song to add to the playlist.');
      return;
    }

    try {
      const songsToAdd = selectedSongIds.map((songId) => ({
        playlist_id: playlistId,
        song_id: songId,
        user_id: user?.id,
      }));

      const { error } = await supabase.from('playlist_songs').insert(songsToAdd);
      if (error) throw error;

      setSelectedSongIds([]);
      toast('Músicas adicionadas à playlist');
      router.refresh();
      onClose?.();
    } catch (error) {
      console.error('Error adding songs:', error);
      toast('Houve um erro ao tentar adicionar as músicas, por favor tente outra vez.');
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
        {!isLoading && filteredSongs.map((song) => (
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
        ))}
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