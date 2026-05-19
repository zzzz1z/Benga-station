import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const preferredRegion = 'cdg1';

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

export async function POST(request: Request) {
  try {
    const { videoIds } = await request.json();

    if (!Array.isArray(videoIds) || !videoIds.length)
      return NextResponse.json({ error: 'No video IDs' }, { status: 400 });

    const valid = videoIds
      .filter((id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id))
      .slice(0, 200);

    if (!valid.length)
      return NextResponse.json({ error: 'No valid IDs' }, { status: 400 });

    // Fire and don't await — worker acks immediately anyway
    fetch(`${WORKER_URL}/preextract-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': WORKER_SECRET,
      },
      body: JSON.stringify({ videoIds: valid }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {});

    return NextResponse.json({ ok: true, queued: valid.length });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}