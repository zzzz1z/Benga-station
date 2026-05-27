import { createClient } from '@supabase/supabase-js';
import SongDetails from "../components/SongDetails";

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from('Songs').select('id');
  return (data ?? []).map((row) => ({ id: String(row.id) }));
}

export default function SongPage() {
  return <SongDetails />;
}