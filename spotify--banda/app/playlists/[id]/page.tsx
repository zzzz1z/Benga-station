import { createClient } from '@supabase/supabase-js';
import PlaylistDetails from '../components/PlaylistDetails';
import Header from '@/components/Header';

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from('Playlists').select('id');
  return (data ?? []).map((row) => ({ id: String(row.id) }));
}

const PlaylistPage = () =>
   <><Header /><PlaylistDetails /></>;
export default PlaylistPage;