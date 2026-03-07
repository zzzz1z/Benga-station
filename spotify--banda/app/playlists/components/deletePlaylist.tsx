import { Playlist } from '@/types';
import { createClient } from '@/utils/supabase/client';
import React from 'react';
import toast from 'react-hot-toast';
import { CiTrash } from "react-icons/ci";
import { useRouter } from "next/navigation";

const supabase = createClient();

interface DeletePlaylistProps {
  data: Playlist;
}

const DeletePlaylist: React.FC<DeletePlaylistProps> = ({ data }) => {
  const router = useRouter();

  const deletePlaylist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const confirmDelete = confirm(`Are you sure you want to delete "${data.title}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('Playlists')
        .delete()
        .eq('id', data.id);

      if (error) throw error;

      toast.success('Playlist deleted successfully.');
      router.push('/playlists');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist. Please try again.');
    }
  };

  return (
    <button
      onClick={deletePlaylist}
      className='rounded-full p-2 flex items-center justify-center hover:opacity-75 transition'>
      <CiTrash size={30} />
    </button>
  );
};

export default DeletePlaylist;