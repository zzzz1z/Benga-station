'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Image from 'next/image';
import { Playlist } from '@/types';
import MediaItem from '@/components/MediaItem';
import AddNewSongs from './AddNewSongs';
import PlaySongsFromPlaylist from './playSongsFromPlaylist';
import DeletePlaylist from './deletePlaylist';
import ShuffleSongs from './ShuffleSongs';
import useOnPlaylist from '@/hooks/useOnPlaylist';

const supabase = createClient();

interface PlaylistDetailsProps {
  data: Playlist['songs']
}

const PlaylistDetails: React.FC<PlaylistDetailsProps> = ({ data }) => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const onPlay = useOnPlaylist(data);

  const fetchPlaylist = async () => {
    setLoading(true);

    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from('Playlists')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (playlistError) throw playlistError;

      const { data: songData, error: songError } = await supabase
        .from('playlist_songs')
        .select('Songs(*)')
        .eq('playlist_id', id);

      if (songError) throw songError;

      if (playlistData && songData) {
        setPlaylist({
          ...playlistData,
          songs: songData.map((item: any) => item.Songs),
        });
      }
    } catch (error) {
      console.error('Error fetching playlist or songs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchPlaylist();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-white">Lista de reprodução não encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <Header>
        <div className="mt-20">
          <div className="flex flex-col md:flex-row items-center gap-x-5">
            <div className="relative h-32 w-32 lg:h-44 lg:w-44">
              <Image
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt="Lista de Músicas"
                className="object-cover"
                src={`${playlist.cover_image}`}
                priority
              />
            </div>
            <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
              <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-bold">
                {playlist.title}
              </h1>
            </div>
          </div>
        </div>
      </Header>

      <div className='flex justify-center items-center gap-3 m-auto mt-4 mb-4 h-10'>
        <PlaySongsFromPlaylist songs={playlist.songs} />
        <ShuffleSongs songs={playlist.songs} />
        <AddNewSongs playlistId={playlist.id} refreshPlaylist={fetchPlaylist} />
        <DeletePlaylist data={playlist} />
      </div>

      <div>
        <ul className='flex-col p-5 items center justify center'>
          {playlist.songs.map((song) => (
            <MediaItem key={song.id} data={song} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PlaylistDetails;