import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/libs/supabaseAdmin'; // Your supabase client setup

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const { data, error } = await supabaseAdmin
    .from('Playlists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}
