'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
const MAX_WARM = 20;
const LS_KEY = 'benga_top_video_ids'; // localStorage key for top played songs

const GlobalWarmer = () => {
    const hasWarmed = useRef(false);

    useEffect(() => {
        if (hasWarmed.current) return;
        hasWarmed.current = true;

        // ── Step 1: Fire instantly from localStorage (before auth resolves) ──
        // This covers returning users — their top songs are already known locally.
        try {
            const cached = localStorage.getItem(LS_KEY);
            if (cached) {
                const ids: string[] = JSON.parse(cached);
                if (Array.isArray(ids) && ids.length > 0) {
                    console.log(`[GlobalWarmer] instant warm ${ids.length} songs from localStorage`);
                    fetch('/api/warm-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ videoIds: ids }),
                    }).catch(() => {});
                }
            }
        } catch (_) {}

        // ── Step 2: Auth + Supabase queries (runs in background) ──
        // Queries play_history for user's top 5 most-played songs,
        // then falls back to liked songs + playlist songs to fill remaining slots.
        const warmLibrary = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const videoIds = new Set<string>();

            // 2a. Top played songs from play_history (most played first)
            const { data: topPlayed } = await supabase
                .from('play_history')
                .select('video_id')
                .eq('user_id', user.id)
                .order('played_at', { ascending: false })
                .limit(50); // fetch 50, deduplicate to get true top 5

            if (topPlayed) {
                // Count plays per video_id to rank them
                const counts: Record<string, number> = {};
                topPlayed.forEach((row: any) => {
                    counts[row.video_id] = (counts[row.video_id] ?? 0) + 1;
                });
                const sorted = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([id]) => id);
                sorted.forEach(id => videoIds.add(id));
            }

            // 2b. Liked songs to fill remaining slots
            if (videoIds.size < MAX_WARM) {
                const { data: liked } = await supabase
                    .from('Músicas_Favoritas')
                    .select('Songs ( youtube_video_id, source )')
                    .eq('user_id', user.id)
                    .limit(MAX_WARM);

                liked?.forEach((row: any) => {
                    const vid = row.Songs?.youtube_video_id;
                    if (row.Songs?.source === 'youtube' && vid) videoIds.add(vid);
                });
            }

            // 2c. Playlist songs to fill remaining slots
            if (videoIds.size < MAX_WARM) {
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
            }

            if (videoIds.size === 0) return;

            const ids = Array.from(videoIds).slice(0, MAX_WARM);

            // ── Step 3: Save top 5 to localStorage for next app open ──
            // Only save the top-played ones (first 5), not the full warm batch.
            try {
                const top5 = ids.slice(0, 5);
                localStorage.setItem(LS_KEY, JSON.stringify(top5));
            } catch (_) {}

            console.log(`[GlobalWarmer] warming ${ids.length} songs from Supabase`);

            // Fire warm-batch — worker deduplicates already-warm songs
            fetch('/api/warm-batch', {
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