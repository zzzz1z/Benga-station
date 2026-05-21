import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { invalidate, keys } from '@/libs/cache';

export const maxDuration = 60;

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  console.log('[import-playlist] POST received');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[import-playlist] Unauthorized — no user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[import-playlist] User authenticated:', user.id);

  const body = await request.json();
  const { url } = body;
  if (!url) {
    console.log('[import-playlist] Missing URL in body');
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }
  console.log('[import-playlist] URL received:', url);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://benga-station.vercel.app';
  console.log('[import-playlist] APP_URL:', APP_URL);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('[import-playlist] Stream started — loading spotify-url-info');
        let spotifyUrlInfo: any;
        try {
          const mod = await import('spotify-url-info');
          spotifyUrlInfo = mod ?? mod;
          console.log('[import-playlist] spotify-url-info loaded, type:', typeof spotifyUrlInfo);
        } catch (importErr: any) {
          console.error('[import-playlist] Failed to import spotify-url-info:', importErr.message);
          send(controller, { status: 'error', message: 'Erro interno ao carregar módulo Spotify.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }

        const { getData } = spotifyUrlInfo(fetch);
        console.log('[import-playlist] getData ready, fetching Spotify data...');

        send(controller, { status: 'fetching', message: 'A obter playlist do Spotify...' });

        let playlistData: any;
        try {
          playlistData = await getData(url);
          console.log('[import-playlist] Spotify data fetched, playlist name:', playlistData?.name);
        } catch (spotifyErr: any) {
          console.error('[import-playlist] Spotify getData failed:', spotifyErr.message);
          send(controller, { status: 'error', message: 'Não foi possível obter a playlist do Spotify.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }

        const tracks: any[] = playlistData?.tracks?.items ?? playlistData?.trackList ?? [];
        console.log('[import-playlist] Tracks found:', tracks.length);

        if (!tracks.length) {
          send(controller, { status: 'error', message: 'Playlist vazia ou não suportada.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }

        const total = tracks.length;
        send(controller, { status: 'matching', message: `A encontrar ${total} músicas...`, total });

        const playlistTitle = playlistData?.name ?? 'Playlist Importada';
        console.log('[import-playlist] Creating playlist:', playlistTitle);

        const { data: newPlaylist, error: playlistError } = await supabase
          .from('Playlists')
          .insert([{ title: playlistTitle, user_id: user.id }])
          .select()
          .single();

        if (playlistError || !newPlaylist) {
          console.error('[import-playlist] Failed to create playlist:', playlistError?.message);
          send(controller, { status: 'error', message: 'Erro ao criar playlist.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }
        console.log('[import-playlist] Playlist created, id:', newPlaylist.id);

        let imported = 0;
        let failed = 0;

        for (const item of tracks) {
          const track = item.track ?? item;
          const title: string = track?.name ?? track?.title ?? '';
          const artist: string =
            track?.artists?.[0]?.name ?? track?.subtitle ?? track?.artist ?? '';

          if (!title) {
            console.warn('[import-playlist] Skipping track with no title');
            failed++;
            continue;
          }

          try {
            const searchUrl = `${APP_URL}/api/youtube/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
            console.log(`[import-playlist] Searching YT for: "${title} ${artist}" → ${searchUrl}`);

            const ytRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
            console.log(`[import-playlist] YT search response status: ${ytRes.status}`);

            const ytData = ytRes.ok ? await ytRes.json() : null;
            const ytTrack = ytData?.results?.[0];

            if (!ytTrack?.videoId) {
              console.warn(`[import-playlist] No YT result for: "${title} ${artist}"`);
              failed++;
              continue;
            }
            console.log(`[import-playlist] Found videoId: ${ytTrack.videoId} for "${title}"`);

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

            if (songError || !song) {
              console.error(`[import-playlist] Upsert failed for "${title}":`, songError?.message);
              failed++;
              continue;
            }

            await supabase.from('playlist_songs').upsert({
              playlist_id: newPlaylist.id,
              song_id: song.id,
              user_id: user.id,
            }, { onConflict: 'playlist_id,song_id' });

            imported++;
            console.log(`[import-playlist] Imported ${imported}/${total}: "${title}"`);

            send(controller, {
              status: 'progress',
              message: `${imported}/${total} importadas`,
              imported,
              total,
              failed,
            });
          } catch (trackErr: any) {
            console.error(`[import-playlist] Exception on track "${title}":`, trackErr.message);
            failed++;
          }
        }

        console.log(`[import-playlist] Done — imported: ${imported}, failed: ${failed}`);
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
        console.error('[import-playlist] Unhandled error:', err.message, err.stack);
        send(controller, { status: 'error', message: err.message ?? 'Erro inesperado.' });
      } finally {
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