'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

const GlobalWarmer = () => {
    const hasWarmed = useRef(false);

    useEffect(() => {
        if (hasWarmed.current) return;
        hasWarmed.current = true;

        const warmInBatches = async (videoIds: string[], batchSize = 5) => {
            for (let i = 0; i < videoIds.length; i += batchSize) {
                const batch = videoIds.slice(i, i + batchSize);
                // Process 5 requests at once, then move to next 5
                await Promise.all(batch.map(videoId => 
                    fetch('/api/preextract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ videoId }),
                    }).catch(() => {})
                ));
            }
        };

        const warmLibrary = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch ALL playlist songs for this user
            const { data: playlists } = await supabase
                .from('Playlists')
                .select(`playlist_songs ( Songs (*) )`)
                .eq('user_id', user.id);

            if (!playlists) return;

            const videoIds: string[] = [];
            playlists.forEach(p => {
                p.playlist_songs?.forEach((ps: any) => {
                    const vid = ps.Songs?.youtube_video_id;
                    if (ps.Songs?.source === 'youtube' && vid) {
                        if (!videoIds.includes(vid)) videoIds.push(vid);
                    }
                });
            });

            if (videoIds.length > 0) {
                warmInBatches(videoIds);
            }
        };

        warmLibrary();
    }, []);

    return null;
};

export default GlobalWarmer;