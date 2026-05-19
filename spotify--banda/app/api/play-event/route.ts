import { NextResponse } from 'next/server';

export const maxDuration = 5;

export async function POST() {
  return NextResponse.json({ ok: true });
}