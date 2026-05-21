import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const preferredRegion = 'cdg1';

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId))
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });

  const range = request.headers.get('range') || 'bytes=0-';

  try {
const workerRes = await fetch(`${WORKER_URL}/stream/${videoId}`, {
  headers: {
    'x-worker-secret': WORKER_SECRET,
    'Range': range,
  },
  redirect: 'follow',
  signal: AbortSignal.timeout(55000),
});

if (workerRes.status === 302) {
  const location = workerRes.headers.get('location');
  if (location) return NextResponse.redirect(location);
  return NextResponse.json({ error: 'Bad redirect' }, { status: 503 });
}

if (!workerRes.ok && workerRes.status !== 206) {
  console.error(`Worker returned ${workerRes.status} for ${videoId}`);
  return NextResponse.json({ error: 'Stream unavailable' }, { status: workerRes.status });
}

    if (!workerRes.ok && workerRes.status !== 206) {
      return NextResponse.json({ error: 'Stream unavailable' }, { status: 503 });
    }

    const headers = new Headers({
      'Content-Type': workerRes.headers.get('Content-Type') || 'audio/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });

    const cr = workerRes.headers.get('Content-Range');
    const cl = workerRes.headers.get('Content-Length');
    if (cr) headers.set('Content-Range', cr);
    if (cl) headers.set('Content-Length', cl);

    // Forward the duration metadata headers explicitly to fix iOS timeline scaling
    const xcd = workerRes.headers.get('X-Content-Duration');
    const cd = workerRes.headers.get('Content-Duration');
    if (xcd) headers.set('X-Content-Duration', xcd);
    if (cd) headers.set('Content-Duration', cd);

    return new NextResponse(workerRes.body, { status: workerRes.status, headers });
  } catch (err: any) {
    console.error('Stream proxy error:', err.message);
    return NextResponse.json({ error: 'Stream failed' }, { status: 503 });
  }
}