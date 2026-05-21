import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { invalidate, keys } from '@/libs/cache';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const spotifyUrlInfo = require('spotify-url-info');
const { getData } = spotifyUrlInfo(fetch);

export const maxDuration = 60;

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

  // Required for Vercel — relative URLs don't work in serverless functions
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://benga-station.vercel.app';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, { status: 'fetching', message: 'A obter playlist...' });

        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

        // Normalised track list — populated by whichever branch runs
        let tracks: { title: string; artist: string }[] = [];
        let playlistTitle = 'Playlist Importada';

        // ── YOUTUBE ───────────────────────────────────────────────
        if (isYouTube) {
          const listMatch = url.match(/[?&]list=([^&]+)/);
          const playlistId = listMatch?.[1];
          if (!playlistId) {
            send(controller, { status: 'error', message: 'ID de playlist YouTube inválido.' });
            controller.enqueue('data: [DONE]\n\n');
            controller.close();
            return;
          }

          const YT_API_KEY = process.env.YOUTUBE_API_KEY;
          if (!YT_API_KEY) throw new Error('YOUTUBE_API_KEY not configured');

          // Playlist title
          const metaRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YT_API_KEY}`
          );
          const metaData = await metaRes.json();
          playlistTitle = metaData?.items?.[0]?.snippet?.title ?? 'YouTube Playlist';

          // All items — paginated, 50 per page
          let pageToken: string | undefined;
          do {
            const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
            const itemsRes = await fetch(
              `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YT_API_KEY}${pageParam}`
            );
            const itemsData = await itemsRes.json();
            for (const item of itemsData?.items ?? []) {
              const snippet = item.snippet;
              const videoId = snippet?.resourceId?.videoId;
              const title = snippet?.title ?? '';
              if (!videoId || title === 'Deleted video' || title === 'Private video') continue;
              tracks.push({ title, artist: snippet?.videoOwnerChannelTitle ?? '' });
            }
            pageToken = itemsData?.nextPageToken;
          } while (pageToken);

        // ── SPOTIFY (original, unchanged) ─────────────────────────
        } else {
          let playlistData: any;
          try {
            playlistData = await getData(url);
          } catch {
            send(controller, { status: 'error', message: 'Não foi possível obter a playlist do Spotify.' });
            controller.enqueue('data: [DONE]\n\n');
            controller.close();
            return;
          }

          playlistTitle = playlistData?.name ?? 'Playlist Importada';
          const rawTracks: any[] = playlistData?.tracks?.items ?? playlistData?.trackList ?? [];
          for (const item of rawTracks) {
            const track = item.track ?? item;
            const title: string = track?.name ?? track?.title ?? '';
            const artist: string =
              track?.artists?.[0]?.name ?? track?.subtitle ?? track?.artist ?? '';
            if (title) tracks.push({ title, artist });
          }
        }

        // ── COMMON ────────────────────────────────────────────────
        if (!tracks.length) {
          send(controller, { status: 'error', message: 'Playlist vazia ou não suportada.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }

        const total = tracks.length;
        send(controller, { status: 'matching', message: `A encontrar ${total} músicas...`, total });

        const { data: newPlaylist, error: playlistError } = await supabase
          .from('Playlists')
          .insert([{ title: playlistTitle, user_id: user.id }])
          .select()
          .single();

        if (playlistError || !newPlaylist) {
          send(controller, { status: 'error', message: 'Erro ao criar playlist.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }

        let imported = 0;
        let failed = 0;

        for (const { title, artist } of tracks) {
          if (!title) { failed++; continue; }

          try {
            // Search YouTube for the track (absolute URL — required on Vercel)
            const ytRes = await fetch(
              `${APP_URL}/api/youtube/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
              { signal: AbortSignal.timeout(10000) }
            );
            const ytData = ytRes.ok ? await ytRes.json() : null;
            const ytTrack = ytData?.results?.[0];

            if (!ytTrack?.videoId) { failed++; continue; }

            // Upsert song — reuse existing if youtube_video_id already in DB
            const { data: song, error: songError } = await supabase
              .from('Songs')
              .upsert({
                title: ytTrack.title ?? title,
                author: ytTrack.artist ?? artist,
                source: 'youtube',
                youtube_video_id: ytTrack.videoId,
                user_id: user.id,
                song_path: '',
                image_path: ytTrack.thumbnail ?? '',
              }, { onConflict: 'youtube_video_id' })
              .select('id')
              .single();

            if (songError || !song) { failed++; continue; }

            // Add to playlist (ignore duplicate errors)
            await supabase.from('playlist_songs').upsert({
              playlist_id: newPlaylist.id,
              song_id: song.id,
              user_id: user.id,
            }, { onConflict: 'playlist_id,song_id' });

            imported++;
            send(controller, {
              status: 'progress',
              message: `${imported}/${total} importadas`,
              imported,
              total,
              failed,
            });
          } catch {
            failed++;
          }
        }

        // Invalidate playlists cache so next server render is fresh
        await invalidate(keys.playlists(user.id));

        send(controller, {
          status: 'done',
          message: `Importação concluída: ${imported} músicas adicionadas.`,
          imported,
          total,
          failed,
          playlistId: newPlaylist.id,
        });
      } catch (err: any) {
        send(controller, { status: 'error', message: err.message ?? 'Erro inesperado.' });
      } finally {
        // Sentinel so the client reader knows to stop
        controller.enqueue('data: [DONE]\n\n');
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}