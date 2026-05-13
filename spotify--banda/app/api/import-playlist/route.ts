import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const spotifyUrlInfo = require('spotify-url-info');
const { getData } = spotifyUrlInfo(fetch);

export const maxDuration = 60;

const WORKER_URL = process.env.YT_WORKER_URL!;
const WORKER_SECRET = process.env.WORKER_SECRET!;

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectPlatform(url: string): 'spotify' | 'youtube' | null {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

function extractYouTubePlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get('list');
  } catch {
    return null;
  }
}

async function searchYouTube(
  query: string,
  signal?: AbortSignal,
): Promise<{ videoId: string; title: string; artist: string; thumbnail: string } | null> {
  try {
    const res = await fetch(`${WORKER_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: { 'x-worker-secret': WORKER_SECRET },
      signal: signal ?? AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchYouTubePlaylist(
  playlistId: string,
  signal?: AbortSignal,
): Promise<{ videoId: string; title: string; artist: string; thumbnail: string }[]> {
  const res = await fetch(`${WORKER_URL}/playlist/${playlistId}`, {
    headers: { 'x-worker-secret': WORKER_SECRET },
    signal: signal ?? AbortSignal.timeout(115000),
  });
  if (!res.ok) throw new Error('Failed to fetch YouTube playlist');
  const data = await res.json();
  return data.tracks ?? [];
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== 'string')
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

  const platform = detectPlatform(url.trim());
  if (!platform)
    return NextResponse.json(
      { error: 'URL não reconhecido. Usa um link do Spotify ou YouTube.' },
      { status: 400 },
    );

  const ac = new AbortController();
  req.signal.addEventListener('abort', () => ac.abort());

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (data: object) => {
    if (ac.signal.aborted) return;
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      ac.abort();
    }
  };

  let closed = false;
  const closeWriter = async () => {
    if (closed) return;
    closed = true;
    try {
      await writer.close();
    } catch {
      // Already closed
    }
  };

  (async () => {
    try {
      let tracks: { title: string; artist: string; thumbnail: string; videoId?: string }[] = [];
      let playlistName = 'Playlist Importada';
      let playlistCover = '';

      // ── Fetch track list ────────────────────────────────────────────────────
      if (platform === 'spotify') {
        await send({ status: 'fetching', message: 'A obter playlist do Spotify...' });
        if (ac.signal.aborted) return;

        const data = await getData(url.trim());

        playlistName = data.name ?? playlistName;
        const images: any[] = data.coverArt?.sources ?? data.images ?? [];
        playlistCover = images[0]?.url ?? '';

        const rawTracks: any[] = data.trackList ?? [];
        tracks = rawTracks.map((item: any) => ({
          title: item.title ?? '',
          artist: item.subtitle ?? '',
          thumbnail: item.coverArt?.sources?.[0]?.url ?? playlistCover,
        }));
      } else {
        const playlistId = extractYouTubePlaylistId(url.trim());
        if (!playlistId) {
          await send({ status: 'error', message: 'Link de playlist YouTube inválido.' });
          return;
        }
        await send({ status: 'fetching', message: 'A obter playlist do YouTube...' });
        if (ac.signal.aborted) return;

        const ytTracks = await fetchYouTubePlaylist(playlistId, ac.signal);
        playlistName = 'Playlist YouTube';
        playlistCover = ytTracks[0]?.thumbnail ?? '';
        tracks = ytTracks.map(t => ({
          title: t.title,
          artist: t.artist,
          thumbnail: t.thumbnail,
          videoId: t.videoId,
        }));
      }

      if (ac.signal.aborted) return;

      if (!tracks.length) {
        await send({ status: 'error', message: 'Nenhuma música encontrada na playlist.' });
        return;
      }

      await send({
        status: 'matching',
        message: `${tracks.length} músicas encontradas. A processar...`,
        total: tracks.length,
      });

      // ── Create playlist record ──────────────────────────────────────────────
      const { data: playlist, error: playlistError } = await supabase
        .from('Playlists')
        .insert({
          user_id: user.id,
          title: playlistName,
          description: `Importada de ${platform === 'spotify' ? 'Spotify' : 'YouTube'}`,
          cover_image: playlistCover,
        })
        .select()
        .single();

      if (playlistError || !playlist) {
        console.error('[import-playlist] playlist insert failed:', JSON.stringify(playlistError));
        await send({ status: 'error', message: 'Erro ao criar playlist.', detail: playlistError?.message ?? 'no data returned' });
        return;
      }

      // ── Process each track ──────────────────────────────────────────────────
      let imported = 0;
      let failed = 0;

      for (const track of tracks) {
        if (ac.signal.aborted) break;

        try {
          let videoId = track.videoId;

          if (!videoId) {
            const query = `${track.title} ${track.artist}`;
            const result = await searchYouTube(query, ac.signal);
            if (!result) {
              failed++;
              continue;
            }
            videoId = result.videoId;
          }

          if (ac.signal.aborted) break;

          const { data: song, error: songError } = await supabase
            .from('Songs')
            .insert({
              user_id: user.id,
              title: track.title,
              author: track.artist,
              source: 'youtube',
              youtube_video_id: videoId,
              song_path: '',
              image_path: track.thumbnail ?? '',
            })
            .select()
            .single();

          if (songError || !song) {
            failed++;
            continue;
          }

          await supabase.from('playlist_songs').insert({
            playlist_id: playlist.id,
            song_id: song.id,
            user_id: user.id,
          });

          imported++;
          await send({ status: 'progress', imported, total: tracks.length, failed });
        } catch {
          failed++;
          await send({ status: 'progress', imported, total: tracks.length, failed });
        }
      }

      if (!ac.signal.aborted) {
        await send({
          status: 'done',
          message: `${imported} músicas importadas${failed > 0 ? `, ${failed} falharam` : ''}.`,
          imported,
          failed,
          playlistId: playlist.id,
        });
      }
    } catch (err: any) {
      if (!ac.signal.aborted) {
        await send({ status: 'error', message: err.message ?? 'Erro desconhecido.' });
      }
    } finally {
      await closeWriter();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}