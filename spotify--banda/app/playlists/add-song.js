import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';

export default function AddSong() {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    const { title, artist, album } = data;
    const { error } = await supabase
      .from('songs')
      .insert([{ title, artist, album }]);

    if (error) console.error('Error adding song:', error);
    else reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" placeholder="Title" {...register('title')} required />
      <input type="text" placeholder="Artist" {...register('artist')} required />
      <input type="text" placeholder="Album" {...register('album')} />
      <button type="submit">Add Song</button>
    </form>
  );
}
