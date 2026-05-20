import { NextResponse } from 'next/server';

export const maxDuration = 60;

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

async function searchViaWorker(query: string) {
  const res = await fetch(`${WORKER_URL}/search?q=${encodeURIComponent(query)}`, {
    headers: { 'x-worker-secret': WORKER_SECRET },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('Worker search failed');
  const data = await res.json();
  if (!data?.results?.length) throw new Error('No results from worker');
  return {
    results: data.results.map((r: any) => ({ ...r, duration: null })),
    nextPageToken: null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageToken = searchParams.get('pageToken') ?? '';

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    try {
      return NextResponse.json(await searchViaWorker(query));
    } catch {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoCategoryId', '10');
    url.searchParams.set('maxResults', '8');
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      console.warn('YouTube API error, falling back to worker:', data?.error?.message ?? response.status);
      return NextResponse.json(await searchViaWorker(query));
    }

    const results = (data.items || []).map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
      duration: null,
    }));

    return NextResponse.json({
      results,
      nextPageToken: data.nextPageToken ?? null,
    });
  } catch (err) {
    console.error('Search error, trying worker fallback:', err);
    try {
      return NextResponse.json(await searchViaWorker(query));
    } catch {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
  }
}