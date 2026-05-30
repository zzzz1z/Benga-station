'use client';

import useLoadImagePlaylist from "@/hooks/useLoadImagePlaylist";
import { Playlist } from "@/types";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const supabase = createClient();

interface PlaylistItemProps {
    data: Playlist;
    onClick?: (id: string) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ data, onClick }) => {
    const imageUrl = useLoadImagePlaylist(data);
    const router = useRouter();

    const handleClick = () => {
router.push(`/playlists?id=${data?.id}`);        if (onClick) onClick(data.id);
    };

    return (
        <div
            onClick={handleClick}
            className="flex items-center gap-x-3 cursor-pointer hover:bg-red-600/5 w-full p-2 border border-transparent hover:border-red-900/30 transition-all group"
        >
            <div className="relative rounded-none min-h-[52px] min-w-[52px] overflow-hidden border border-white/5">
                <Image
                    priority fill
                    sizes="52px"
                    src={imageUrl ?? '/images/likedit.png'}
                    alt={`${data.title}`}
                    className="object-cover grayscale-[0.5] group-hover:grayscale-0 transition duration-500"
                />
                <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="flex flex-col gap-y-0.5 overflow-hidden">
                <p className="text-white font-black uppercase tracking-tighter group-hover:text-red-500 transition truncate">
                    {data.title}
                </p>
                <p className="text-red-600/40 font-mono text-[9px] uppercase tracking-[0.2em]">
                    DIR_TYPE::PLAYLIST
                </p>
            </div>
        </div>
    );
};

export default PlaylistItem;