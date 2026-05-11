import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');
    if (!songId) return NextResponse.json({ error: 'Missing songId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ liked: false });

    const { data } = await supabase
        .from('Músicas_Favoritas')
        .select('*')
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .maybeSingle();

    return NextResponse.json({ liked: !!data });
}

export async function POST(request: Request) {
    const { songId } = await request.json();
    if (!songId) return NextResponse.json({ error: 'Missing songId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
        .from('Músicas_Favoritas')
        .insert({ song_id: songId, user_id: user.id });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
    const { songId } = await request.json();
    if (!songId) return NextResponse.json({ error: 'Missing songId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
        .from('Músicas_Favoritas')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}