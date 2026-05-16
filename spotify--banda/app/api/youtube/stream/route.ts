import { NextResponse } from 'next/server';

export const maxDuration = 15;
export const preferredRegion = 'cdg1';

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId))
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });

  try {
    const res = await fetch(`${WORKER_URL}/resolve/${videoId}`, {
      headers: { 'x-worker-secret': WORKER_SECRET },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok)
      return NextResponse.json({ error: 'Resolution failed' }, { status: 503 });

    const data = await res.json();
    if (!data?.url)
      return NextResponse.json({ error: 'No URL returned' }, { status: 503 });

    return NextResponse.json({ url: data.url, duration: data.duration });
  } catch (err: any) {
    console.error('[stream route] error:', err.message);
    return NextResponse.json({ error: 'Stream failed' }, { status: 503 });
  }
}