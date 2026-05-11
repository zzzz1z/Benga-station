import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { playlistId, song } = await request.json();
    if (!playlistId || !song) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    let songId: string;

    if (song.source === 'youtube' && song.youtube_video_id) {
        const { data: upserted, error: upsertError } = await supabase
            .from('Songs')
            .upsert({
                title: song.title,
                author: song.author,
                source: 'youtube',
                youtube_video_id: song.youtube_video_id,
                user_id: user.id,
                song_path: '',
                image_path: song.image_path,
            }, { onConflict: 'youtube_video_id' })
            .select()
            .single();

        if (upsertError) {
            console.error('UPSERT ERROR', upsertError);
            return NextResponse.json({ error: upsertError.message, detail: upsertError }, { status: 500 });
        }
        songId = upserted.id;
    } else {
        songId = song.id;
    }

    const { error } = await supabase.from('playlist_songs').insert({
        playlist_id: playlistId,
        song_id: songId,
        user_id: user.id,
    });

    if (error) {
        console.error('INSERT ERROR', error);
        return NextResponse.json({ error: error.message, detail: error }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
}