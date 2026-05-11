import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await context.params;

  const { data, error } = await supabase
    .from('Songs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Song not found' }, { status: 404 });
  }

  return NextResponse.json({ song: data });
}