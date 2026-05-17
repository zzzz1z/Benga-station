'use client';

import { Playlist } from "@/types";
import Button from "@/components/Botão";
import useAuthModal from "@/hooks/useAuthModal";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import { useUser } from "@/hooks/useUser";
import PlaylistItem from "./PlaylistsItem";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useRefresh } from "@/hooks/useRefresh";
import { usePlaylists } from "@/hooks/usePlaylists";

interface LikedPlaylistsProps {
    playlists: Playlist[];
}

const LikedContent: React.FC<LikedPlaylistsProps> = ({ playlists: initialPlaylists }) => {
    const { user, isLoading } = useUser();
    const authModal = useAuthModal();
    const playlistModal = usePlaylistModal();
    const router = useRouter();
    const { refreshKey } = useRefresh();
    const { playlists: contextPlaylists, refreshPlaylists } = usePlaylists();

    // Use context playlists if available, fallback to initial
    const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);

    useEffect(() => {
        if (!isLoading && !user) router.replace('/');
    }, [isLoading, user, router]);

    // Sync with context playlists
    useEffect(() => {
        if (contextPlaylists.length > 0) setPlaylists(contextPlaylists);
    }, [contextPlaylists]);

    // Respond to floating refresh button
    useEffect(() => {
        if (refreshKey === 0) return;
        refreshPlaylists().then(() => {
            setPlaylists(contextPlaylists);
        });
    }, [refreshKey]);

    const onClick = () => {
        if (!user) return authModal.onOpen('sign_up');
        return playlistModal.onOpen();
    };

    const onPlaylistClick = (playlistId: string) => {
        router.push(`/playlists/${playlistId}`);
    };

    return (
        <div className="flex flex-col gap-y-2 w-full p-6">
            <Button onClick={onClick}>
                Criar Playlist
            </Button>

            {playlists.map((playlist) => (
                <div key={playlist.id} className="flex items-center gap-x-4 w-full">
                    <div className="flex-1">
                        <PlaylistItem
                            onClick={onPlaylistClick}
                            data={playlist}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LikedContent;