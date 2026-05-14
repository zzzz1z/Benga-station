import { NextResponse } from 'next/server';

export const maxDuration = 60;

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

// Calls the worker's /warm endpoint which extracts sequentially in the background.
// We await the worker's acknowledgement (not completion) so the client gets a real response.
export async function POST(request: Request) {
    try {
        const { videoIds } = await request.json();

        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            return NextResponse.json({ error: 'No video IDs provided' }, { status: 400 });
        }

        const valid = videoIds.filter((id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id)).slice(0, 20);
        if (valid.length === 0) {
            return NextResponse.json({ error: 'No valid video IDs' }, { status: 400 });
        }

        // Tell the worker to start warming — it queues them internally
        // We don't await completion, just that the worker accepted the job
        const res = await fetch(`${WORKER_URL}/warm`, {
            method: 'POST',
            headers: {
                'x-worker-secret': WORKER_SECRET,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoIds: valid }),
            signal: AbortSignal.timeout(10000), // just wait for ack
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[warm-batch] worker error:', err);
            return NextResponse.json({ error: 'Worker rejected request' }, { status: 502 });
        }

        return NextResponse.json({ ok: true, queued: valid.length });
    } catch (err: any) {
        console.error('[warm-batch] error:', err.message);
        return NextResponse.json({ error: 'Failed to queue warm' }, { status: 500 });
    }
}