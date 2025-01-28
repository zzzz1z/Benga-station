import { Playlist } from '@/types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React from 'react'
import toast from 'react-hot-toast';
import { CiTrash } from "react-icons/ci";
import { useRouter } from "next/navigation";


interface DeletePlaylistProps {
  data: Playlist;
}


const DeletePlaylist: React.FC<DeletePlaylistProps> = ({
  data
}) => {

  const supabaseClient = useSupabaseClient()
  const router = useRouter()



  const deletePlaylist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering the `handleClick` event

    const confirmDelete = confirm(`Are you sure you want to delete "${data.title}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabaseClient
        .from('Playlists')
        .delete()
        .eq('id', data.id);

      if (error) {
        throw error;
      }

      toast.success('Playlist deleted successfully.');
      router.refresh(); // Refresh to reflect the updated list
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist. Please try again.');
    }
  };








  return (
    <button
    onClick={deletePlaylist}
    className='
    rounded-full
    p-2
    flex
    items-center
    justify-center
    hover:opacity-75transition'>
     <CiTrash size={40} 
     />
    </button>
  )
}

export default DeletePlaylist
