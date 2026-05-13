'use client';

import useLoadImage from "@/hooks/useLoadImage";
import { Song, Playlist } from "@/types";
import Image from "next/image";
import PlayButton from "./PlayButton";
import { AiFillHeart, AiOutlineHeart, AiOutlineInfoCircle } from "react-icons/ai";
import { MdPlaylistAdd } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import useAuthModal from "@/hooks/useAuthModal";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SongItemProps {
    data: Song;
    onClick: (id: string) => void;
}

const SongItem: React.FC<SongItemProps> = ({ data, onClick }) => {
    const imagePath = useLoadImage(data);
    const { user } = useUser();
    const authModal = useAuthModal();
    const router = useRouter();

    const [isLiked, setIsLiked] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    const songId = String(data.id);

    // --- YOUR LOGIC PRESERVED ---
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
        } else {
            toast.error('Erro ao atualizar favoritos');
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
                onClick={() => onClick(data.id)}
                className="
                  relative group flex flex-col items-center justify-center 
                  overflow-hidden bg-neutral-400/5 cursor-pointer 
                  hover:bg-neutral-400/10 transition p-3 border border-white/5 
                  hover:border-red-500/50
                "
                style={{
                  clipPath: "polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)"
                }}
            >
                {/* HUD Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500 opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500 opacity-0 group-hover:opacity-100 transition" />

                <div className="relative aspect-square w-full h-full overflow-hidden bg-neutral-800">
                    <Image
                        priority
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        src={imagePath ?? '/images/likedit.png'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={data.title ?? 'Song cover image'}
                    />
                    {/* Red tint on hover */}
                    <div className="absolute inset-0 bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex flex-col items-start w-full pt-4 pb-2 gap-y-1">
                    <p className="font-black truncate w-full text-white uppercase text-xs tracking-tighter">
                      {data.title}
                    </p>
                    <p className="text-neutral-500 text-[10px] truncate w-full font-bold tracking-[0.2em]">
                      MOD: {data.author}
                    </p>
                </div>

                {/* Desktop Action Buttons */}
                <div
                    className="absolute top-4 right-4 hidden md:flex flex-col gap-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={handleLike} className="flex items-center justify-center w-8 h-8 bg-black/80 border border-white/10 text-neutral-400 hover:text-white hover:border-red-500 transition shadow-lg">
                        {isLiked ? <AiFillHeart size={16} className="text-red-500" /> : <AiOutlineHeart size={16} />}
                    </button>
                    <button onClick={handlePlaylistClick} className="flex items-center justify-center w-8 h-8 bg-black/80 border border-white/10 text-neutral-400 hover:text-white hover:border-red-500 transition shadow-lg">
                        <MdPlaylistAdd size={18} />
                    </button>
                    <button onClick={handleInfo} className="flex items-center justify-center w-8 h-8 bg-black/80 border border-white/10 text-neutral-400 hover:text-white hover:border-red-500 transition shadow-lg">
                        <AiOutlineInfoCircle size={16} />
                    </button>
                </div>

                {/* Mobile three-dot menu */}
                <div
                    className="absolute top-3 right-3 md:hidden z-30"
                    ref={menuRef}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => setShowMenu(prev => !prev)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-black/80 text-white border border-red-500/50"
                    >
                        <BsThreeDotsVertical size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 rounded-lg shadow-2xl z-[100] overflow-hidden border border-red-500/30">
                            <button onClick={handleLike} className="flex items-center gap-x-3 w-full px-4 py-3 text-xs uppercase font-bold text-white hover:bg-red-500/10 transition">
                                {isLiked ? <AiFillHeart size={16} className="text-red-500" /> : <AiOutlineHeart size={16} className="text-neutral-400" />}
                                {isLiked ? 'Remover' : 'Favoritar'}
                            </button>
                            <button onClick={handlePlaylistClick} className="flex items-center gap-x-3 w-full px-4 py-3 text-xs uppercase font-bold text-white hover:bg-red-500/10 transition">
                                <MdPlaylistAdd size={18} className="text-neutral-400" />
                                Add Playlist
                            </button>
                            <button onClick={handleInfo} className="flex items-center gap-x-3 w-full px-4 py-3 text-xs uppercase font-bold text-white hover:bg-red-500/10 transition">
                                <AiOutlineInfoCircle size={16} className="text-neutral-400" />
                                Detalhes
                            </button>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-5 right-5 group-hover:opacity-100 opacity-0 transition-all translate-y-2 group-hover:translate-y-0" role="presentation">
                    <PlayButton />
                </div>
            </div>

            <Modal isOpen={showModal} onChange={open => setShowModal(open)} title="Terminal: Playlists" description="Selecione o diretório de destino:">
                <div className="flex flex-col gap-y-2">
                    {playlists.length === 0
                        ? <p className="text-neutral-500 text-xs font-mono text-center py-4 uppercase tracking-widest">Acesso Negado: Sem Playlists</p>
                        : playlists.map(pl => (
                            <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id)}
                                className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-white bg-neutral-800 border border-white/5 hover:border-red-500 hover:bg-red-500/10 transition truncate">
                                {pl.title}
                            </button>
                        ))
                    }
                </div>
            </Modal>
        </>
    );
};

export default SongItem;