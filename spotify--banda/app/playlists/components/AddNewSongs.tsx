'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/Botão';
import { Song } from '@/types';
import ModalToAddNewSongs from './ModalToAddNewSongs';
import MediaItem from '@/components/MediaItem';
import { CiCirclePlus } from "react-icons/ci";

const supabase = createClient();

interface AddNewSongsProps {
  playlistId: string;
  refreshPlaylist: () => void;
}

const AddNewSongs: React.FC<AddNewSongsProps> = ({ playlistId, refreshPlaylist }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [playlistSongs, setPlaylistSongs] = useState<Set<string>>(new Set());
  const [warning, setWarning] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSongs = async () => {
    const { data, error } = await supabase.from('Songs').select('*');
    if (error) {
      console.error('Error fetching songs:', error);
    } else {
      setSongs(data || []);
    }
  };

  const fetchPlaylistSongs = async () => {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select('song_id')
      .eq('playlist_id', playlistId);

    if (error) {
      console.error('Error fetching playlist songs:', error);
    } else {
      const playlistSongIds = new Set(data?.map((item: { song_id: string }) => item.song_id));
      setPlaylistSongs(playlistSongIds);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSongs();
      fetchPlaylistSongs();
    }
  }, [isOpen]);

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckboxChange = (songId: string) => {
    setSelectedSongs((prev) => {
      const updatedSet = new Set(prev);
      if (updatedSet.has(songId)) {
        updatedSet.delete(songId);
      } else {
        updatedSet.add(songId);
      }
      return updatedSet;
    });

    if (playlistSongs.has(songId)) {
      setWarning('Essa música já se encontra na playlist atual!!!');
      setSelectedSongs((prev) => {
        const updatedSet = new Set(prev);
        updatedSet.delete(songId);
        return updatedSet;
      });
      setTimeout(() => setWarning(null), 4000);
    } else {
      setWarning(null);
    }
  };

  const handleAddSongs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const selectedSongsArray = Array.from(selectedSongs);

      const updates = selectedSongsArray.map((songId) => ({
        user_id: user?.id,
        playlist_id: playlistId,
        song_id: songId,
      }));

      const { error } = await supabase.from('playlist_songs').insert(updates);
      if (error) throw error;

      setIsOpen(false);
      setSelectedSongs(new Set());
      refreshPlaylist();
    } catch (error) {
      console.error('Error adding songs to playlist:', error);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <CiCirclePlus size={30} />
      </button>

      <ModalToAddNewSongs
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Adicionar músicas à Playlist">

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Pesquisar..."
            className="p-2 mb-4 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {warning && <p className="text-red-500 text-sm">{warning}</p>}

          <div className="max-h-60 overflow-y-auto">
            {filteredSongs.map((song) => (
              <div key={song.id} className="flex items-center justify-between p-2">
                <MediaItem data={song} />
                <input
                  type="checkbox"
                  id={`song-${song.id}`}
                  checked={selectedSongs.has(song.id)}
                  onChange={() => handleCheckboxChange(song.id)}
                />
                {selectedSongs.has(song.id) && <span>✔</span>}
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleAddSongs} className="mt-4">
          Adicionar
        </Button>
      </ModalToAddNewSongs>
    </>
  );
};

export default AddNewSongs;