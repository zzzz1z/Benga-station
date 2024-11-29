import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const supabaseClient = useSupabaseClient()

  const { data, error } = await supabaseClient
    .from('Playlists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}
