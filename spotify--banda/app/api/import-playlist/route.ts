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

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, { status: 'fetching', message: 'A obter playlist do Spotify...' });

        let playlistData: any;
        try {
          playlistData = await getData(url);
        } catch {
          send(controller, { status: 'error', message: 'Não foi possível obter a playlist do Spotify.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }

        const tracks: any[] = playlistData?.tracks?.items ?? playlistData?.trackList ?? [];
        if (!tracks.length) {
          send(controller, { status: 'error', message: 'Playlist vazia ou não suportada.' });
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          return;
        }

        const total = tracks.length;
        send(controller, { status: 'matching', message: `A encontrar ${total} músicas...`, total });

        // Create playlist
        const playlistTitle = playlistData?.name ?? 'Playlist Importada';
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

        for (const item of tracks) {
          const track = item.track ?? item;
          const title: string = track?.name ?? track?.title ?? '';
          const artist: string =
            track?.artists?.[0]?.name ?? track?.subtitle ?? track?.artist ?? '';

          if (!title) { failed++; continue; }

          try {
            // Search YouTube for the track
            const ytRes = await fetch(
              `/api/youtube/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
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