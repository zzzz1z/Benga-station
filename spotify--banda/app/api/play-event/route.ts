import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TOP_PLAYED_KEY = 'benga:top_played';
const TOP_PLAYED_MAX = 20;

export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();

    if (!videoId || typeof videoId !== 'string')
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // Insert play event into Supabase
    const { error } = await supabase
      .from('play_history')
      .insert({ user_id: user.id, video_id: videoId });

    if (error) {
      console.error('[play-event] insert error:', error.message);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    // Update top played list in Redis for cron pre-warm
    // Read current list, increment count for this video, keep top 20
    try {
      const current: { id: string; count: number }[] =
        (await redis.get(TOP_PLAYED_KEY)) ?? [];

      const existing = current.find(e => e.id === videoId);
      if (existing) {
        existing.count++;
      } else {
        current.push({ id: videoId, count: 1 });
      }

      const sorted = current
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_PLAYED_MAX);

      // Store with 30 day TTL — refreshed on every play so it never expires in practice
      await redis.set(TOP_PLAYED_KEY, sorted, { ex: 30 * 24 * 60 * 60 });
    } catch (e: any) {
      console.warn('[play-event] Redis update failed:', e.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[play-event] error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}