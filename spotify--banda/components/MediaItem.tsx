'use client';

import useLoadImage from "@/hooks/useLoadImage";
import usePlayer from "@/hooks/usePlayer";
import { Song, Playlist } from "@/types";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { AiFillHeart, AiOutlineHeart, AiOutlineInfoCircle } from "react-icons/ai";
import { MdPlaylistAdd } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useUser } from "@/hooks/useUser";
import useAuthModal from "@/hooks/useAuthModal";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import OfflineButton from "@/components/OfflineButton";

interface MediaItemProps {
    data: Song;
    onClick?: () => void;
}

const MediaItem: React.FC<MediaItemProps> = ({ data, onClick }) => {
    const imageUrl = useLoadImage(data);
    const player = usePlayer();
    const { user } = useUser();
    const authModal = useAuthModal();
    const router = useRouter();

    const [isLiked, setIsLiked] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    const songId = String(data.id);

    useEffect(() => {
        if (!user?.id) return;
        fetch(`/api/likes?songId=${songId}`)
            .then(res => res.json())
            .then(json => { if (json.liked) setIsLiked(true); });
    }, [user?.id, songId]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
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
        const res = await fetch('/api/likes', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songId }),
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
        const res = await fetch('/api/playlist/user-playlists');
        const json = await res.json();
        setPlaylists(json.playlists ?? []);
        setShowMenu(false);
        setShowModal(true);
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        const res = await fetch('/api/playlist/add-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlistId, song: data }),
        });
        if (res.status === 409) toast.error('Música já está na playlist');
        else if (!res.ok) toast.error('Erro ao adicionar música');
        else toast.success('Adicionado à playlist!');
        setShowModal(false);
    };

    const handleInfo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        router.push(`/songs/${data.id}`);
    };

    return (
        <>
            <div
                onClick={handleClick}
                className="flex items-center gap-4 cursor-pointer hover:bg-red-600/5 p-2 rounded-none w-full group border-l-2 border-transparent hover:border-red-600 transition-all relative overflow-hidden"
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

                {/* Desktop hover buttons */}
                <div
                    className="hidden md:flex items-center gap-x-4 flex-shrink-0 pr-2 opacity-0 group-hover:opacity-100 transition translate-x-4 group-hover:translate-x-0"
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={handleLike} className="text-neutral-500 hover:text-red-500 transition">
                        {isLiked ? <AiFillHeart size={18} className="text-red-600" /> : <AiOutlineHeart size={18} />}
                    </button>
                    <button onClick={handlePlaylistClick} className="text-neutral-500 hover:text-red-500 transition">
                        <MdPlaylistAdd size={20} />
                    </button>
                    <button onClick={handleInfo} className="text-neutral-500 hover:text-red-500 transition">
                        <AiOutlineInfoCircle size={18} />
                    </button>
                    <OfflineButton song={data} size={18} />
                </div>

                {/* Mobile three-dot menu */}
                <div className="relative md:hidden flex-shrink-0" ref={menuRef} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowMenu(prev => !prev)} className="text-red-900/40 p-2">
                        <BsThreeDotsVertical size={16} />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 bottom-full mb-1 w-48 bg-neutral-950 border border-red-900/40 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                            <button onClick={handleLike} className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-red-600/10 transition border-b border-white/5">
                                {isLiked ? <AiFillHeart size={16} className="text-red-500" /> : <AiOutlineHeart size={16} />}
                                {isLiked ? 'Remover_Fav' : 'Adicionar_Fav'}
                            </button>
                            <button onClick={handlePlaylistClick} className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-red-600/10 transition border-b border-white/5">
                                <MdPlaylistAdd size={16} /> Add_Playlist
                            </button>
                            <button onClick={handleInfo} className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-red-600/10 transition border-b border-white/5">
                                <AiOutlineInfoCircle size={16} /> Ver_Metadata
                            </button>
                            <div className="flex items-center gap-x-3 w-full px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-red-600/10 transition">
                                <OfflineButton song={data} size={16} />
                                <span>Offline</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={showModal} onChange={open => setShowModal(open)} title="SYNC_PLAYLIST" description="Selecione o destino para o pacote de dados:">
                <div className="flex flex-col gap-y-2 mt-4">
                    {playlists.length === 0
                        ? <p className="text-red-600/40 font-mono text-xs text-center py-4 tracking-tighter">NULL_DIRECTORIES_FOUND</p>
                        : playlists.map(pl => (
                            <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id)}
                                className="w-full text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-900/5 border border-red-900/20 hover:bg-red-600 hover:text-white transition truncate">
                                {'>'} {pl.title}
                            </button>
                        ))
                    }
                </div>
            </Modal>
        </>
    );
};

export default MediaItem;