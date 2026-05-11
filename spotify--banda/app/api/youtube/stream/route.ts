import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const preferredRegion = 'cdg1'; // Paris — close to Hetzner

const WORKER_URL = process.env.YT_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;



export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  if (!WORKER_URL) {
    return NextResponse.json({ error: 'Worker not configured' }, { status: 500 });
  }

  const range = request.headers.get('range') || 'bytes=0-';

  try {
    const workerRes = await fetch(`${WORKER_URL}/stream/${videoId}`, {
      headers: {
        'x-worker-secret': WORKER_SECRET!,
        'Range': range,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(55000),
    });

    if (!workerRes.ok && workerRes.status !== 206) {
      const errText = await workerRes.text();
      console.error(`Worker error ${workerRes.status}:`, errText);
      return NextResponse.json({ error: 'Stream unavailable' }, { status: 503 });
    }

    const status = workerRes.status;
    const headers = new Headers({
      'Content-Type': workerRes.headers.get('Content-Type') || 'audio/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });

    const contentRange = workerRes.headers.get('Content-Range');
    const contentLength = workerRes.headers.get('Content-Length');
    if (contentRange) headers.set('Content-Range', contentRange);
    if (contentLength) headers.set('Content-Length', contentLength);

    return new NextResponse(workerRes.body, { status, headers });
  } catch (err) {
    console.error('Stream proxy error:', err);
    return NextResponse.json({ error: 'Stream failed' }, { status: 503 });
  }
}