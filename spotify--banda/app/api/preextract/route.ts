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

  try {
    const extractRes = await fetch(`${WORKER_URL}/extract/${videoId}`, {
      headers: { 'x-worker-secret': WORKER_SECRET! },
      signal: AbortSignal.timeout(50000), // 50s — give yt-dlp enough time
    });

    if (!extractRes.ok) {
      return NextResponse.json({ error: 'Extraction failed' }, { status: 502 });
    }

    const { url } = await extractRes.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL returned' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Preextract error:', err.message);
    return NextResponse.json({ error: 'Failed' }, { status: 502 });
  }
}