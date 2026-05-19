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
      // Check if we warmed recently — if so, worker Redis is still hot, skip
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const videoIds = new Set<string>();

      const { data: liked } = await supabase
        .from('Músicas_Favoritas')
        .select('Songs ( youtube_video_id, source )')
        .eq('user_id', user.id);

      liked?.forEach((row: any) => {
        const vid = row.Songs?.youtube_video_id;
        if (row.Songs?.source === 'youtube' && vid) videoIds.add(vid);
      });

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
          .slice(0, 20) // top 20 most played, not just 5
          .forEach(([id]) => videoIds.add(id));
      }

      if (!videoIds.size) return;

      const ids = Array.from(videoIds);
      console.log(`[GlobalWarmer] warming ${ids.length} songs`);

      fetch('/api/preextract-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: ids }),
      }).catch(() => {});

      // Mark as warmed — next open within 5h will skip
      try {
        localStorage.setItem(LS_WARMED_AT_KEY, Date.now().toString());
      } catch (_) {}
    };

    warmLibrary();
  }, []);

  return null;
};

export default GlobalWarmer;