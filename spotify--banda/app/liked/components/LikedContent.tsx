'use client';

import LikedButton from "@/components/LikedButton";
import MediaItem from "@/components/MediaItem";
import useOnPlay from "@/hooks/useOnPlay";
import { useUser } from "@/hooks/useUser";
import { Song } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { BounceLoader } from "react-spinners";
import { useRefresh } from "@/hooks/useRefresh";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface LikedContentProps {
    songs: Song[];
}

const getSongPlayerId = (song: Song): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const LikedContent: React.FC<LikedContentProps> = ({ songs: initialSongs }) => {
    const router = useRouter();
    const { isLoading, user } = useUser();
    const [songs, setSongs] = useState<Song[]>(initialSongs);
    const [mounted, setMounted] = useState(false);
    const { refreshKey } = useRefresh();
    const onPlay = useOnPlay(songs);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isLoading && !user) router.replace('/');
    }, [isLoading, user, router]);

    const fetchSongs = useCallback(async () => {
        if (!user?.id) return;
        const { data, error } = await supabase
            .from('liked_songs')
            .select('Songs(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSongs(data.map((item: any) => item.Songs).filter(Boolean));
        }
    }, [user?.id]);

    useEffect(() => {
        if (refreshKey === 0) return;
        fetchSongs();
    }, [refreshKey]);

    if (!mounted || isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <BounceLoader color="#A52A2A" size={40} />
            </div>
        );
    }

    if (songs.length === 0) {
        return (
            <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
                Sem bengas por aqui ✖︎
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-2 w-full p-6">
            {songs.map((song) => (
                <div key={song.id} className="flex items-center gap-x-4 w-full">
                    <div className="flex-1">
                        <MediaItem
                            onClick={() => onPlay(getSongPlayerId(song))}
                            data={song}
                        />
                    </div>
                    <LikedButton songId={song.id} />
                </div>
            ))}
        </div>
    );
};

export default LikedContent;