'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import MediaItem from '@/components/MediaItem';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import { Song } from '@/types';
import { useRouter } from 'next/navigation';
import { markDataStale } from '@/components/FloatingRefreshButton';
import { MdMusicOff } from 'react-icons/md';

const supabase = createClient();

const SLASH = 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)';

interface AddSongToPlaylistProps {
  playlistId: string;
  onClose?: () => void;
}

const AddSongToPlaylistModal: React.FC<AddSongToPlaylistProps> = ({ playlistId, onClose }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('Songs').select('*');
        if (error) throw error;
        setSongs(data || []);
        setFilteredSongs(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSongs();
  }, []);

  useEffect(() => {
    setFilteredSongs(
      songs.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, songs]);

  const handleCheckboxChange = (songId: string) => {
    setSelectedSongIds(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleAddSongs = async () => {
    if (selectedSongIds.length === 0) return;
    try {
      const { error } = await supabase.from('playlist_songs').insert(
        selectedSongIds.map(songId => ({ playlist_id: playlistId, song_id: songId, user_id: user?.id }))
      );
      if (error) throw error;
      setSelectedSongIds([]);
      toast.success('Músicas adicionadas!');
      markDataStale();
      router.refresh();
      onClose?.();
    } catch {
      toast.error('Erro ao adicionar músicas.');
    }
  };

  return (
    <div className="flex flex-col gap-y-3 w-full">

      {/* Search */}
      <input
        type="text"
        placeholder="PESQUISAR_TRACKS..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full bg-neutral-900 border border-red-900/30 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-2.5 placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50"
        style={{ clipPath: SLASH }}
      />

      {/* List */}
      <div className="max-h-64 overflow-y-auto flex flex-col gap-y-0.5 pr-1">
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-x-2">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent animate-spin" />
            <span className="text-red-600/40 font-mono text-[9px] uppercase tracking-widest">A_CARREGAR...</span>
          </div>
        )}
        {!isLoading && filteredSongs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-y-2">
            <MdMusicOff size={18} className="text-red-900/40" />
            <p className="text-red-900/40 font-mono text-[9px] uppercase tracking-widest">SEM_RESULTADOS</p>
          </div>
        )}
        {!isLoading && filteredSongs.map(song => (
          <div
            key={song.id}
            onClick={() => handleCheckboxChange(String(song.id))}
            className={`flex items-center gap-x-2 cursor-pointer border-l-2 transition ${
              selectedSongIds.includes(String(song.id))
                ? 'border-red-500 bg-red-500/5'
                : 'border-transparent'
            }`}
          >
            <div className="flex-1 min-w-0 pointer-events-none">
              <MediaItem data={song} />
            </div>
            <div
              className={`flex-shrink-0 w-4 h-4 mr-2 border transition flex items-center justify-center ${
                selectedSongIds.includes(String(song.id))
                  ? 'bg-red-500 border-red-500'
                  : 'border-neutral-700'
              }`}
              style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
            >
              {selectedSongIds.includes(String(song.id)) && (
                <span className="text-white text-[8px] font-black">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={handleAddSongs}
        disabled={selectedSongIds.length === 0}
        className="w-full py-3 text-[10px] font-mono uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: selectedSongIds.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${selectedSongIds.length > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.05)'}`,
          color: selectedSongIds.length > 0 ? '#f87171' : '#4b4b4b',
          clipPath: SLASH,
        }}
      >
        {selectedSongIds.length > 0
          ? `SYNC ${selectedSongIds.length} TRACK${selectedSongIds.length > 1 ? 'S' : ''}`
          : 'SELECIONAR TRACKS'
        }
      </button>
    </div>
  );
};

export default AddSongToPlaylistModal;