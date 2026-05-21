// app/api/keepalive/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.YT_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

// 1. Handles your Foreground Frontend React Component (GET)
export async function GET() {
  try {
    await fetch(`${WORKER_URL}/ping`, {
      method: 'GET',
      headers: { 'x-worker-secret': WORKER_SECRET! },
    });
    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error("VPS Keepalive ping failed:", error);
    return new Response('failed', { status: 502 });
  }
}

// 2. Handles your Native iOS Background Worker (POST)
export async function POST(request: Request) {
  try {
    // Edge-safe body parsing validation block
    let body = {};
    if (request.body) {
      try {
        body = await request.json();
      } catch (_) {
        // Suppress parsing errors for empty or non-JSON payloads
      }
    }
    
    // Forward the ping downstream to keep your self-hosted VPS active
    await fetch(`${WORKER_URL}/ping`, {
      method: 'GET',
      headers: { 'x-worker-secret': WORKER_SECRET! },
    });
    
    return NextResponse.json({ status: 'ok', client: 'ios-native', trace: body }, { status: 200 });
  } catch (error) {
    console.error("Background runner failed to proxy to VPS:", error);
    return NextResponse.json({ status: 'error', message: 'vps-unreachable' }, { status: 502 });
  }
}