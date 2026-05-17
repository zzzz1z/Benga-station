import { NextResponse } from 'next/server';
import getSongs from '@/actions/getSongs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const result = await getSongs(title, page);

  return NextResponse.json(result);
}