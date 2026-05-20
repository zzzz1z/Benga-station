// app/api/keepalive/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log("▲ Foreground ping received from Next.js Webview");
  return NextResponse.json({ status: 'ok', source: 'foreground' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🪐 Native Background Fetch ping received from iOS Device:", body);
    return NextResponse.json({ status: 'ok', source: 'background' });
  } catch (e) {
    return NextResponse.json({ status: 'ok', source: 'background-fallback' });
  }
}