'use client';

import useLoadImage from "@/hooks/useLoadImage";
import usePlayer from "@/hooks/usePlayer";
import { Song, Playlist } from "@/types";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { AiFillHeart, AiOutlineHeart, AiOutlineInfoCircle } from "react-icons/ai";
import { MdOutlineNotInterested, MdPlaylistAdd } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useUser } from "@/hooks/useUser";
import useAuthModal from "@/hooks/useAuthModal";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { authedFetch } from "@/utils/api";

interface MediaItemProps {
    data: Song;
    onClick?: () => void;
    onRemove?: () => void;
    playlistMode?: boolean;

}

const MediaItem: React.FC<MediaItemProps> = ({ data, onClick, onRemove, playlistMode }) => {
    const imageUrl = useLoadImage(data);
    const player = usePlayer();
    const { user } = useUser();
    const authModal = useAuthModal();
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

    const [isLiked, setIsLiked] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    const songId = String(data.id);



    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setShowMenu(false);
                setMenuPos(null);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    const handleClick = () => {
        if (onClick) onClick();
        else player.setId(songId);
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) { authModal.onOpen('sign_up'); return; }
        const method = isLiked ? 'DELETE' : 'POST';
        const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/likes`, {
            method,
            body: JSON.stringify({ song_id: songId }),
        });
        if (res.ok) {
            setIsLiked(!isLiked);
            toast.success(isLiked ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
        }
        setShowMenu(false);
    };

    const handlePlaylistClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) { authModal.onOpen('sign_up'); return; }
        const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlist/user-playlists`);
        const json = await res.json();
        setPlaylists(json.playlists ?? json ?? []);
        setShowMenu(false);
        setShowModal(true);
    };

 const handleAddToPlaylist = async (playlistId: string) => {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlist/add-song`, {
        method: 'POST',
        body: JSON.stringify({ playlist_id: playlistId, song_id: data.id }),
    });
    if (res.status === 409) toast.error('Música já está na playlist');
    else if (!res.ok) toast.error('Erro ao adicionar música');
    else toast.success('Adicionado à playlist!');
    setShowModal(false);
};

    const handleInfo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        ;
    };

    return (
        <>
<button
    onClick={handleClick}
    className="flex items-center gap-4 hover:bg-red-600/5 p-2 rounded-none w-full group border-l-2 border-transparent hover:border-red-600 transition-all relative text-left"
>
                <div className="relative rounded-none h-14 w-16 flex-shrink-0 overflow-hidden border border-white/5">
                    <Image
                        priority fill
                        sizes="64px"
                        src={imageUrl ?? '/images/likedit.png'}
                        alt={data.title}
                        className="object-cover grayscale-[0.4] group-hover:grayscale-0 transition duration-500"
                    />
                </div>

                <div className="flex flex-col w-full gap-y-0.5 min-w-0">
                    <p className="text-white font-black uppercase italic tracking-tighter truncate w-full group-hover:text-red-500 transition">
                        {data.title}
                    </p>
                    <p className="text-red-600/50 font-mono text-[10px] uppercase tracking-widest">
                        DATA_NODE::{data.author.replace(/\s+/g, '_')}
                    </p>
                </div>

<div
    className="hidden md:flex items-center gap-x-4 flex-shrink-0 pr-2 transition"
    onClick={e => e.stopPropagation()}
>
    <button onClick={handleLike} className="text-neutral-500 hover:text-red-500 transition">
        {isLiked ? <AiFillHeart size={18} className="text-red-600" /> : <AiOutlineHeart size={18} />}
    </button>
    {!playlistMode && (
        <button onClick={handlePlaylistClick} className="text-neutral-500 hover:text-red-500 transition">
            <MdPlaylistAdd size={20} />
        </button>
    )}
    {!playlistMode && (
        <button onClick={handleInfo} className="text-neutral-500 hover:text-red-500 transition">
            <AiOutlineInfoCircle size={18} />
        </button>
    )}
    {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-neutral-500 hover:text-red-500 transition">
            <MdOutlineNotInterested size={18} />
        </button>
    )}
</div>

                <div className="relative md:hidden flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                        ref={triggerRef}
                        onClick={() => {
                            if (showMenu) { setShowMenu(false); setMenuPos(null); return; }
                            const rect = triggerRef.current?.getBoundingClientRect();
                            if (rect) setMenuPos({ top: rect.top - 4, right: window.innerWidth - rect.right });
                            setShowMenu(true);
                        }}
                        className="text-red-900/40 p-2"
                    >
                        <BsThreeDotsVertical size={16} />
                    </button>
                </div>
            </button>

            {showMenu && menuPos && (
                <div
                    ref={menuRef}
                    className="fixed z-[999] w-48 bg-neutral-950 border border-red-900/40 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden"
                    style={{ top: menuPos.top, right: menuPos.right, transform: 'translateY(-100%)' }}
                    onClick={e => e.stopPropagation()}
                >
<button onClick={handleLike} className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-white active:bg-red-600/10 transition border-b border-white/5">
    {isLiked ? <AiFillHeart size={16} className="text-red-500" /> : <AiOutlineHeart size={16} />}
    {isLiked ? 'Remover_Fav' : 'Adicionar_Fav'}
</button>
{!playlistMode && (
    <button onClick={handlePlaylistClick} className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-white active:bg-red-600/10 transition border-b border-white/5">
        <MdPlaylistAdd size={16} /> adicionar a uma playlist
    </button>
)}
{!playlistMode && (
    <button onClick={handleInfo} className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-white active:bg-red-600/10 transition border-b border-white/5">
        <AiOutlineInfoCircle size={16} /> Ver_Metadata
    </button>
)}
{onRemove && (
    <button onClick={e => { e.stopPropagation(); onRemove(); }} className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-red-500 active:bg-red-600/10 transition">
        <MdOutlineNotInterested size={16} /> remover da playlist
    </button>
)}
                  
                </div>
            )}

             <Modal isOpen={showModal} onChange={open => setShowModal(open)} title="Adicionar à playlist" description="Escolhe uma playlist para adicionar esta música">
        <div className="flex flex-col gap-y-2">
          {playlists.length === 0
            ? <p className="text-neutral-400 text-sm text-center py-4">Sem playlists criadas</p>
            : playlists.map(pl => (
              <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id)}
                className="w-full text-left px-4 py-3 text-sm text-white bg-neutral-700 hover:bg-neutral-600 rounded-md transition truncate">
                {pl.title}
              </button>
            ))
          }
        </div>
      </Modal>
        </>
    );
};

export default MediaItem;