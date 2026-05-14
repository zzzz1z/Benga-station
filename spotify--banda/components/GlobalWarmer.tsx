'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
const MAX_WARM = 20; // cap so we don't hammer the worker on login

const GlobalWarmer = () => {
    const hasWarmed = useRef(false);

    useEffect(() => {
        if (hasWarmed.current) return;
        hasWarmed.current = true;

        const warmLibrary = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const videoIds = new Set<string>();

            // 1. Liked songs — Músicas_Favoritas → Songs
            const { data: liked } = await supabase
                .from('Músicas_Favoritas')
                .select('Songs ( youtube_video_id, source )')
                .eq('user_id', user.id)
                .limit(MAX_WARM);

            liked?.forEach((row: any) => {
                const vid = row.Songs?.youtube_video_id;
                if (row.Songs?.source === 'youtube' && vid) videoIds.add(vid);
            });

            // 2. Playlist songs — Playlists → playlist_songs → Songs
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
            console.log(`[GlobalWarmer] warming ${ids.length} songs`);

            // Fire a single batch request — don't spam individual preextract calls
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