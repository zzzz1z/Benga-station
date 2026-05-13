// GlobalWarmer — simplified, uses shared helper
'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { scheduleWarm } from '@/utils/warmCache';

const supabase = createClient(); // module-level, stable across HMR

const GlobalWarmer = () => {
    const hasWarmed = useRef(false);

    useEffect(() => {
        if (hasWarmed.current) return;
        hasWarmed.current = true; // set early to block StrictMode double-invoke

        const warmLibrary = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: playlists } = await supabase
                .from('Playlists')
                .select(`playlist_songs ( Songs (*) )`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!playlists) return;

            const videoIds: string[] = [];
            playlists.forEach(p => {
                p.playlist_songs?.forEach((ps: any) => {
                    const vid = ps.Songs?.youtube_video_id;
                    if (ps.Songs?.source === 'youtube' && vid) videoIds.push(vid);
                });
            });

            scheduleWarm(videoIds.slice(0, 40));
        };

        warmLibrary();
    }, []);

    return null;
};

export default GlobalWarmer;