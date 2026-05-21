export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.YT_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

export async function GET() {
  try {
    await fetch(`${WORKER_URL}/ping`, {
      headers: { 'x-worker-secret': WORKER_SECRET! },
    });
    return new Response('ok');
  } catch {
    return new Response('failed');
  }
}