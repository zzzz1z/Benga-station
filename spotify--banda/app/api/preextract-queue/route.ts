import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const preferredRegion = 'cdg1';

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

export async function POST(request: Request) {
  try {
    const { videoIds } = await request.json();

    if (!Array.isArray(videoIds) || !videoIds.length) {
      return NextResponse.json({ error: 'No video IDs' }, { status: 400 });
    }

    // Sanitize and limit to 200 IDs per request chunk
    const valid = videoIds
      .filter((id: string) => typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id))
      .slice(0, 200);

    if (!valid.length) {
      return NextResponse.json({ error: 'No valid IDs' }, { status: 400 });
    }

    // CRITICAL: We MUST await the worker's initial validation/acceptance 
    // response so Vercel doesn't freeze the container midway.
    const response = await fetch(`${WORKER_URL}/preextract-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': WORKER_SECRET,
      },
      body: JSON.stringify({ videoIds: valid }),
      signal: AbortSignal.timeout(15000), 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Worker Error] Status: ${response.status} - ${errorText}`);
      return NextResponse.json({ error: 'Worker rejected processing batch' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, queued: valid.length, workerResponse: data });
  } catch (error: any) {
    console.error('[API Error] Pre-extract bridge failed:', error.message || error);
    return NextResponse.json({ error: 'Internal execution pipeline failed' }, { status: 500 });
  }
}