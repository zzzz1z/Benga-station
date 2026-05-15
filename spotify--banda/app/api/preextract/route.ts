import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const preferredRegion = 'cdg1';

const WORKER_URL = process.env.YT_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

export async function POST(request: Request) {
  const { videoId } = await request.json();

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  if (!WORKER_URL) {
    return NextResponse.json({ error: 'Worker not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${WORKER_URL}/extract/${videoId}`, {
      headers: { 'x-worker-secret': WORKER_SECRET! },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'Extraction failed' }, { status: 200 });
    }

    const data = await res.json();
    if (!data?.url) {
      return NextResponse.json({ ok: false, error: 'No URL returned' }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Timeout or network error — mark as unavailable
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}