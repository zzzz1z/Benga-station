import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await context.params;

  const { data, error } = await supabase
    .from('Comments')
    .select('*, profiles(full_name, email)')
    .eq('song_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

  const { error } = await supabase.from('Comments').insert({
    song_id: id,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get('commentId');
  if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });

  const { error } = await supabase
    .from('Comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}