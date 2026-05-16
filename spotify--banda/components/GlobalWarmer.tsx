'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
const LS_KEY = 'benga_top_video_ids';

const GlobalWarmer = () => {
  const hasWarmed = useRef(false);

  useEffect(() => {
    if (hasWarmed.current) return;
    hasWarmed.current = true;

    // Step 1: Fire instantly from localStorage before auth resolves
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) {
        const ids: string[] = JSON.parse(cached);
        if (Array.isArray(ids) && ids.length > 0) {
          console.log(`[GlobalWarmer] instant preextract ${ids.length} songs from localStorage`);
          fetch('/api/preextract-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoIds: ids }),
          }).catch(() => {});
        }
      }
    } catch (_) {}

    // Step 2: Auth + full library preextract
    const warmLibrary = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const videoIds = new Set<string>();

      // All liked songs
      const { data: liked } = await supabase
        .from('Músicas_Favoritas')
        .select('Songs ( youtube_video_id, source )')
        .eq('user_id', user.id);

      liked?.forEach((row: any) => {
        const vid = row.Songs?.youtube_video_id;
        if (row.Songs?.source === 'youtube' && vid) videoIds.add(vid);
      });

      // All playlist songs
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

      // Top played from play_history for localStorage cache
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
        const top5 = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);

        // Save top 5 for next app open
        try { localStorage.setItem(LS_KEY, JSON.stringify(top5)); } catch (_) {}

        // Add top played to the extraction set too
        top5.forEach(id => videoIds.add(id));
      }

      if (!videoIds.size) return;

      const ids = Array.from(videoIds);
      console.log(`[GlobalWarmer] preextracting full library — ${ids.length} songs`);

      fetch('/api/preextract-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: ids }),
      }).catch(() => {});
    };

    warmLibrary();
  }, []);

  return null;
};

export default GlobalWarmer;