import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageToken = searchParams.get('pageToken') ?? '';

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
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
      console.error('YouTube API error:', JSON.stringify(data));
      return NextResponse.json({ error: 'YouTube API error', detail: data }, { status: 500 });
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
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}