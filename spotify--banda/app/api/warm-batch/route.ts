import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const preferredRegion = 'cdg1';

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

// Legacy alias — forwards to preextract-queue, no ID cap
export async function POST(request: Request) {
  try {
    const { videoIds } = await request.json();

    if (!Array.isArray(videoIds) || !videoIds.length)
      return NextResponse.json({ error: 'No video IDs provided' }, { status: 400 });

    const valid = videoIds.filter((id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id));
    if (!valid.length)
      return NextResponse.json({ error: 'No valid video IDs' }, { status: 400 });

    fetch(`${WORKER_URL}/preextract-queue`, {
      method: 'POST',
      headers: {
        'x-worker-secret': WORKER_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoIds: valid }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});

    return NextResponse.json({ ok: true, queued: valid.length });
  } catch (err: any) {
    console.error('[warm-batch] error:', err.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}