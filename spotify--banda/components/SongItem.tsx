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
                className="relative group flex flex-col items-center justify-center rounded-md overflow-hidden gap-x-4 bg-neutral-400/10 cursor-pointer hover:bg-neutral-400/20 transition p-3"
            >
                <div className="relative aspect-square w-full h-full rounded-md overflow-hidden">
                    <Image
                        priority
                        className="object-cover"
                        src={imagePath ?? '/images/likedit.png'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={data.title ?? 'Song cover image'}
                    />
                </div>

                <div className="flex flex-col items-start w-full p-4 gap-y-1">
                    <p className="font-semibold truncate w-full">{data.title}</p>
                    <p className="text-neutral-400 text-sm w-full truncate">{data.author}</p>
                </div>

                {/* Desktop: hover buttons top-right */}
                <div
                    className="absolute top-2 right-2 hidden md:flex flex-col gap-y-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={handleLike} className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-neutral-400 hover:text-white transition">
                        {isLiked ? <AiFillHeart size={14} className="text-red-500" /> : <AiOutlineHeart size={14} />}
                    </button>
                    <button onClick={handlePlaylistClick} className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-neutral-400 hover:text-white transition">
                        <MdPlaylistAdd size={16} />
                    </button>
                    <button onClick={handleInfo} className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-neutral-400 hover:text-white transition">
                        <AiOutlineInfoCircle size={14} />
                    </button>
                </div>

                {/* Mobile: three-dot menu top-right */}
                <div
                    className="absolute top-2 right-2 md:hidden"
                    ref={menuRef}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => setShowMenu(prev => !prev)}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-neutral-400"
                    >
                        <BsThreeDotsVertical size={14} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden border border-neutral-700">
                            <button onClick={handleLike} className="flex items-center gap-x-3 w-full px-4 py-3 text-sm text-white hover:bg-neutral-700 transition">
                                {isLiked ? <AiFillHeart size={16} className="text-red-500" /> : <AiOutlineHeart size={16} className="text-neutral-400" />}
                                {isLiked ? 'Remover favorito' : 'Adicionar favorito'}
                            </button>
                            <button onClick={handlePlaylistClick} className="flex items-center gap-x-3 w-full px-4 py-3 text-sm text-white hover:bg-neutral-700 transition">
                                <MdPlaylistAdd size={16} className="text-neutral-400" />
                                Adicionar à playlist
                            </button>
                            <button onClick={handleInfo} className="flex items-center gap-x-3 w-full px-4 py-3 text-sm text-white hover:bg-neutral-700 transition">
                                <AiOutlineInfoCircle size={16} className="text-neutral-400" />
                                Ver detalhes
                            </button>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-4 right-5 group-hover:opacity-100 opacity-0 transition-opacity" role="presentation">
                    <PlayButton />
                </div>
            </div>

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

export default SongItem;