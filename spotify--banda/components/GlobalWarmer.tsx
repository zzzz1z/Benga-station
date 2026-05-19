'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
const LS_WARMED_AT_KEY = 'benga_warmed_at';
const WARM_INTERVAL_MS = 5 * 60 * 60 * 1000; // 5 hours

const GlobalWarmer = () => {
  const hasWarmed = useRef(false);

  useEffect(() => {
    if (hasWarmed.current) return;
    hasWarmed.current = true;

    const warmLibrary = async () => {
      try {
        const warmedAt = localStorage.getItem(LS_WARMED_AT_KEY);
        if (warmedAt) {
          const elapsed = Date.now() - parseInt(warmedAt, 10);
          if (elapsed < WARM_INTERVAL_MS) {
            console.log(`[GlobalWarmer] skipping — warmed ${Math.round(elapsed / 60000)}m ago`);
            return;
          }
        }
      } catch (_) {}

      // Random jitter 0-60s so 300 users don't all hit Supabase at once after a deploy
      await new Promise(res => setTimeout(res, Math.random() * 60000));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const videoIds = new Set<string>();

      // 1. Full library — warm everything so Redis is always hot
      let page = 0;
      const PAGE_SIZE = 200;
      while (true) {
        const { data: songs } = await supabase
          .from('Songs')
          .select('youtube_video_id, source')
          .eq('source', 'youtube')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (!songs || songs.length === 0) break;
        songs.forEach((song: any) => {
          if (song.youtube_video_id) videoIds.add(song.youtube_video_id);
        });
        if (songs.length < PAGE_SIZE) break;
        page++;
      }

      // 2. User's liked songs
      const { data: liked } = await supabase
        .from('Músicas_Favoritas')
        .select('Songs ( youtube_video_id, source )')
        .eq('user_id', user.id);

      liked?.forEach((row: any) => {
        const vid = row.Songs?.youtube_video_id;
        if (row.Songs?.source === 'youtube' && vid) videoIds.add(vid);
      });

      // 3. User's playlists
      const { data: playlists } = await supabase
        .from('Playlists')
        .select('playlist_songs ( Songs ( youtube_video_id, source ) )')
        .eq('user_id', user.id);

      playlists?.forEach((p: any) => {
        p.playlist_songs?.forEach((ps: any) => {
          const vid = ps.Songs?.youtube_video_id;
          if (ps.Songs?.source === 'youtube' && vid) videoIds.add(vid);
        });
      });

      // 4. User's top played
      const { data: topPlayed } = await supabase
        .from('play_history')
        .select('video_id')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(50);

      if (topPlayed) {
        const counts: Record<string, number> = {};
        topPlayed.forEach((row: any) => {
          counts[row.video_id] = (counts[row.video_id] ?? 0) + 1;
        });
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .forEach(([id]) => videoIds.add(id));
      }

      if (!videoIds.size) return;

      const ids = Array.from(videoIds);
      console.log(`[GlobalWarmer] warming ${ids.length} songs`);

      // Send in batches of 50 to avoid oversized requests
      const BATCH_SIZE = 50;
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        fetch('/api/preextract-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds: batch }),
        }).catch(() => {});
      }

      try {
        localStorage.setItem(LS_WARMED_AT_KEY, Date.now().toString());
      } catch (_) {}
    };

    warmLibrary();
  }, []);

  return null;
};

export default GlobalWarmer;