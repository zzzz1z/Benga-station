'use client';

import { Playlist } from "@/types";
import useAuthModal from "@/hooks/useAuthModal";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import { useUser } from "@/hooks/useUser";
import PlaylistItem from "./PlaylistsItem";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRefresh } from "@/hooks/useRefresh";
import { usePlaylists } from "@/hooks/usePlaylists";
import { HiPlus } from "react-icons/hi";
import { TbPlaylist } from "react-icons/tb";

interface LikedPlaylistsProps {
    playlists: Playlist[];
}

const SLASH_CUT = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";

const PlaylistContent: React.FC<LikedPlaylistsProps> = ({ playlists: initialPlaylists }) => {
    const { user, isLoading } = useUser();
    const authModal = useAuthModal();
    const playlistModal = usePlaylistModal();
    const router = useRouter();
    const { refreshKey } = useRefresh();
    const { playlists: contextPlaylists, refreshPlaylists } = usePlaylists();
    const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isLoading && !user) router.replace('/');
    }, [isLoading, user, router]);

    useEffect(() => {
        if (contextPlaylists.length > 0) setPlaylists(contextPlaylists);
    }, [contextPlaylists]);

    useEffect(() => {
        if (refreshKey === 0) return;
        refreshPlaylists().then(() => setPlaylists(contextPlaylists));
    }, [refreshKey]);

    const onClick = () => {
        if (!user) return authModal.onOpen('sign_up');
        return playlistModal.onOpen();
    };

    const onPlaylistClick = (playlistId: string) => {
        router.push(`/playlists/${playlistId}`);
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col w-full p-4 gap-y-3">

            {/* Create button */}
            <button
                onClick={onClick}
                className="relative flex items-center gap-x-3 w-full px-5 py-4 bg-red-600/10 border border-red-600/30 active:bg-red-600/20 active:border-red-500/60 transition-all group overflow-hidden"
                style={{ clipPath: SLASH_CUT }}
            >
                {/* sweep on active */}
                <div className="absolute inset-0 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-red-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center justify-center w-8 h-8 bg-red-600/20 border border-red-500/40 flex-shrink-0" style={{ clipPath: SLASH_CUT }}>
                    <HiPlus size={16} className="text-red-400" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-black uppercase tracking-tight">Nova Playlist</span>
                    <span className="text-red-500/40 text-[9px] font-mono uppercase tracking-widest">CRIAR_NOVO_DIRETÓRIO</span>
                </div>
                <span className="ml-auto text-red-600/30 font-mono text-xs">›</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-x-3 px-1 py-1">
                <TbPlaylist size={12} className="text-red-600/30 flex-shrink-0" />
                <div className="flex-1 h-px bg-red-900/20" />
                <span className="text-[8px] font-mono text-red-600/20 uppercase tracking-[0.3em]">{playlists.length} DIRS</span>
            </div>

            {/* Empty state */}
            {playlists.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-y-3">
                    <div className="w-12 h-12 border border-red-900/30 flex items-center justify-center" style={{ clipPath: SLASH_CUT }}>
                        <TbPlaylist size={20} className="text-red-900/50" />
                    </div>
                    <p className="text-red-900/40 font-mono text-[9px] uppercase tracking-[0.3em] text-center">
                        SEM_PLAYLISTS<br />CRIAR_PRIMEIRO_DIR
                    </p>
                </div>
            )}

            {/* Playlist list */}
            <div className="flex flex-col gap-y-1">
                {playlists.map((playlist, i) => (
                    <div
                        key={playlist.id}
                        className="opacity-0 animate-[fadeSlideIn_0.3s_ease_forwards]"
                        style={{ animationDelay: `${i * 0.04}s` }}
                    >
                        <PlaylistItem onClick={onPlaylistClick} data={playlist} />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateX(20px) skewX(-2deg); }
                    to   { opacity: 1; transform: translateX(0) skewX(0deg); }
                }
            `}</style>
        </div>
    );
};

export default PlaylistContent;