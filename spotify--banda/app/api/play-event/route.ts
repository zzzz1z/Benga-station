import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 10;

export async function POST(request: Request) {
    try {
        const { videoId } = await request.json();

        if (!videoId || typeof videoId !== 'string') {
            return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }

        const { error } = await supabase
            .from('play_history')
            .insert({ user_id: user.id, video_id: videoId });

        if (error) {
            console.error('[play-event] insert error:', error.message);
            return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error('[play-event] error:', err.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}