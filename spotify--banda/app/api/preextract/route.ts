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
    // 1. TRIGGER THE WORKER (Don't 'await' the full response body)
    // We send the fetch but we don't wait for the worker to finish the extract
    fetch(`${WORKER_URL}/extract/${videoId}`, {
      headers: { 'x-worker-secret': WORKER_SECRET! },
    }).catch(err => console.error("Background extraction failed:", err));

    // 2. RESPOND IMMEDIATELY TO THE FRONTEND
    // This stops the 502 error because the connection is closed successfully
    return NextResponse.json({ ok: true, message: 'Extraction started' });
    
  } catch (err: any) {
    return NextResponse.json({ error: 'Trigger failed' }, { status: 500 });
  }
}