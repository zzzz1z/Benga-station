import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, author, youtube_video_id, image_path } = await request.json();
  if (!youtube_video_id) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });

  const { data, error } = await supabase
    .from('Songs')
    .upsert({
      title,
      author,
      source: 'youtube',
      youtube_video_id,
      user_id: user.id,
      song_path: '',
      image_path,
    }, { onConflict: 'youtube_video_id' })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}