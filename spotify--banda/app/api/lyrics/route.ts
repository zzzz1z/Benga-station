import { NextResponse } from 'next/server';

export const maxDuration = 15;
export const preferredRegion = 'cdg1';

const WORKER_URL = process.env.YT_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId))
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });

  if (!WORKER_URL)
    return NextResponse.json({ error: 'Worker not configured' }, { status: 500 });

  try {
    const res = await fetch(`${WORKER_URL}/lyrics/${videoId}`, {
      headers: { 'x-worker-secret': WORKER_SECRET! },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return NextResponse.json({ found: false }, { status: 200 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  }
}