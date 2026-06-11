'use client';

import useLoadImagePlaylist from "@/hooks/useLoadImagePlaylist";
import { Playlist } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";


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
<button
    onClick={handleClick}
    className="flex items-center gap-x-3 w-full p-2 border border-transparent  group text-left"
>
            <div className="relative rounded-none min-h-[52px] min-w-[52px] overflow-hidden border border-white/5">
                <Image
                    priority fill
                    sizes="52px"
                    src={imageUrl ?? '/images/likedit.png'}
                    alt={`${data.title}`}
                    className="object-cover "
                />
                <div className="absolute inset-0 bg-red-600/10 opacity-0 " />
            </div>
            <div className="flex flex-col gap-y-0.5 overflow-hidden">
                <p className="text-white font-black uppercase tracking-tighter">
                    {data.title}
                </p>
                <p className="text-red-600/40 font-mono text-[9px] uppercase tracking-[0.2em]">
                    DIR_TYPE::PLAYLIST
                </p>
            </div>
        </button>
    );
};

export default PlaylistItem;