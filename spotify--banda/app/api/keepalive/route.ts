// app/api/keepalive/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.YT_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

// 1. Handles your Frontend React component (GET)
export async function GET() {
  try {
    // Ping your self-hosted VPS to wake up its network adapters
    await fetch(`${WORKER_URL}/ping`, {
      method: 'GET',
      headers: { 'x-worker-secret': WORKER_SECRET! },
    });
    return new Response('ok');
  } catch (error) {
    console.error("VPS Keepalive ping failed:", error);
    return new Response('failed', { status: 502 });
  }
}

// 2. Handles your Native iOS Background Worker (POST)
export async function POST(request: Request) {
  try {
    // Read tracing data sent from iOS if you want to log it
    const body = await request.json().catch(() => ({}));
    
    // Forward the ping downstream to your VPS to ensure it stays active
    await fetch(`${WORKER_URL}/ping`, {
      method: 'GET',
      headers: { 'x-worker-secret': WORKER_SECRET! },
    });
    
    return NextResponse.json({ status: 'ok', client: 'ios-native' });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'vps-unreachable' }, { status: 502 });
  }
}