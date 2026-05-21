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
    console.log('[import-playlist] Stream started');

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isSpotify = url.includes('spotify.com');

    if (!isYouTube && !isSpotify) {
      send(controller, { status: 'error', message: 'URL não suportada. Use Spotify ou YouTube.' });
      return;
    }

    send(controller, { status: 'fetching', message: 'A obter playlist...' });

    let tracks: { title: string; artist: string }[] = [];
    let playlistTitle = 'Playlist Importada';

    // ── YOUTUBE PATH ──────────────────────────────────────────────
    if (isYouTube) {
      const listMatch = url.match(/[?&]list=([^&]+)/);
      const playlistId = listMatch?.[1];
      if (!playlistId) {
        send(controller, { status: 'error', message: 'ID de playlist YouTube inválido.' });
        return;
      }
      console.log('[import-playlist] YouTube playlist ID:', playlistId);

      const YT_API_KEY = process.env.YOUTUBE_API_KEY;
      if (!YT_API_KEY) throw new Error('YOUTUBE_API_KEY not set');

      // Fetch playlist metadata
      const metaRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YT_API_KEY}`
      );
      const metaData = await metaRes.json();
      playlistTitle = metaData?.items?.[0]?.snippet?.title ?? 'YouTube Playlist';
      console.log('[import-playlist] YouTube playlist title:', playlistTitle);

      // Fetch all playlist items (max 50 per page)
      let pageToken: string | undefined;
      do {
        const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
        const itemsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YT_API_KEY}${pageParam}`
        );
        const itemsData = await itemsRes.json();
        console.log('[import-playlist] YT page fetched, items:', itemsData?.items?.length);

        for (const item of itemsData?.items ?? []) {
          const snippet = item.snippet;
          const videoId = snippet?.resourceId?.videoId;
          const title = snippet?.title ?? '';
          // Skip deleted/private videos
          if (!videoId || title === 'Deleted video' || title === 'Private video') continue;
          // YouTube playlist items don't have a separate artist field —
          // videoOwnerChannelTitle is the channel name, good enough as fallback
          tracks.push({ title, artist: snippet?.videoOwnerChannelTitle ?? '' });
        }
        pageToken = itemsData?.nextPageToken;
      } while (pageToken);

      console.log('[import-playlist] Total YT tracks collected:', tracks.length);
    }

    // ── SPOTIFY PATH ──────────────────────────────────────────────
    if (isSpotify) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const spotifyUrlInfo = require('spotify-url-info');
      console.log('[import-playlist] spotify-url-info type:', typeof spotifyUrlInfo);
      const { getData } = spotifyUrlInfo(fetch);

      let playlistData: any;
      try {
        playlistData = await getData(url);
        console.log('[import-playlist] Spotify playlist name:', playlistData?.name);
      } catch (spotifyErr: any) {
        console.error('[import-playlist] Spotify getData failed:', spotifyErr.message);
        send(controller, { status: 'error', message: 'Não foi possível obter a playlist do Spotify.' });
        return;
      }

      playlistTitle = playlistData?.name ?? 'Playlist Importada';
      const rawTracks: any[] = playlistData?.tracks?.items ?? playlistData?.trackList ?? [];
      for (const item of rawTracks) {
        const track = item.track ?? item;
        const title = track?.name ?? track?.title ?? '';
        const artist = track?.artists?.[0]?.name ?? track?.subtitle ?? track?.artist ?? '';
        if (title) tracks.push({ title, artist });
      }
      console.log('[import-playlist] Spotify tracks collected:', tracks.length);
    }

    // ── COMMON: match + insert ────────────────────────────────────
    if (!tracks.length) {
      send(controller, { status: 'error', message: 'Playlist vazia ou não suportada.' });
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
      console.error('[import-playlist] Failed to create playlist:', playlistError?.message);
      send(controller, { status: 'error', message: 'Erro ao criar playlist.' });
      return;
    }
    console.log('[import-playlist] Playlist created, id:', newPlaylist.id);

    let imported = 0;
    let failed = 0;

    for (const { title, artist } of tracks) {
      try {
        const searchUrl = `${APP_URL}/api/youtube/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
        console.log(`[import-playlist] Searching YT for: "${title} ${artist}"`);

        const ytRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
        console.log(`[import-playlist] YT search status: ${ytRes.status}`);

        const ytData = ytRes.ok ? await ytRes.json() : null;
        const ytTrack = ytData?.results?.[0];

        if (!ytTrack?.videoId) {
          console.warn(`[import-playlist] No YT result for: "${title} ${artist}"`);
          failed++;
          continue;
        }

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
        send(controller, { status: 'progress', message: `${imported}/${total} importadas`, imported, total, failed });

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
      imported, total, failed,
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