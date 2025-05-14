// app/playlists/[id]/page.tsx
import PlaylistDetails from '../components/PlaylistDetails';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export async function generateStaticParams() {
  const supabase = useSupabaseClient(); // your Supabase client setup

  const { data: playlists } = await supabase.from('Playlists').select('id');

  return playlists?.map((playlist) => ({
    id: playlist.id.toString(),
  })) || [];
}

interface PlaylistPageProps {
  params: {
    id: string;
  };
}

const PlaylistPage = async ({ params }: PlaylistPageProps) => {
  const supabase = useSupabaseClient();
  const { data } = await supabase
    .from('Playlists')
    .select('*')
    .eq('id', params.id)
    .single();

  return <PlaylistDetails data={data ? [data] : []} />;
};

export default PlaylistPage;
