import useLoadImage from "@/hooks/useLoadImage";
import { Song, Playlist } from "@/types";
import Image from "next/image";
import { AiFillHeart, AiOutlineHeart, AiOutlineInfoCircle } from "react-icons/ai";
import { MdPlaylistAdd } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import useAuthModal from "@/hooks/useAuthModal";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import PlayButton from "@/components/PlayButton";
import OfflineButton from "@/components/OfflineButton";

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
            toast.success(isLiked ? 'Removido dos favoritos' : 'Adicionado!');
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
        if (res.status === 409) toast.error('Música já existe na playlist');
        else if (res.ok) toast.success('Adicionado!');
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
                className="relative group flex flex-col cursor-pointer transition p-0"
            >
                {/* Image Wrapper */}
                <div className="relative aspect-square w-full overflow-hidden rounded-sm">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-600 opacity-0 group-hover:opacity-100 transition-all z-10" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-600 opacity-0 group-hover:opacity-100 transition-all z-10" />

                    <Image
                        priority
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        src={imagePath ?? '/images/likedit.png'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={data.title}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <PlayButton />
                    </div>

                    {/* Desktop Overlay Actions */}
                    <div
                        className="absolute top-2 right-2 hidden md:flex flex-col gap-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={handleLike} className="p-1.5 bg-black/40 backdrop-blur-md rounded-sm text-white hover:text-red-500 transition">
                            {isLiked ? <AiFillHeart size={18} className="text-red-600" /> : <AiOutlineHeart size={18} />}
                        </button>
                        <button onClick={handlePlaylistClick} className="p-1.5 bg-black/40 backdrop-blur-md rounded-sm text-white hover:text-red-600 transition">
                            <MdPlaylistAdd size={20} />
                        </button>
                        <div className="p-1.5 bg-black/40 backdrop-blur-md rounded-sm">
                            <OfflineButton song={data} size={18} />
                        </div>
                    </div>
                </div>

                {/* Text Section */}
                <div className="flex flex-col items-start w-full pt-3 gap-y-0.5">
                    <p className="font-black truncate w-full text-white uppercase text-sm tracking-tight group-hover:text-red-500 transition-colors">
                        {data.title}
                    </p>
                    <div className="flex items-center gap-x-2 w-full">
                        <span className="h-px w-3 bg-red-600/50" />
                        <p className="text-neutral-500 text-[10px] truncate font-bold tracking-[0.15em] uppercase">
                            {data.author}
                        </p>
                    </div>
                </div>

                {/* Mobile three-dot menu */}
                <div
                    className="absolute top-2 right-2 md:hidden z-30"
                    ref={menuRef}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => setShowMenu(prev => !prev)}
                        className="p-1 bg-black/60 rounded-sm text-white border border-red-600/30"
                    >
                        <BsThreeDotsVertical size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-neutral-900 shadow-2xl z-[100] border border-red-600/30">
                            <button onClick={handleLike} className="flex items-center gap-x-3 w-full px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-red-600/10 transition">
                                {isLiked ? <AiFillHeart className="text-red-600" /> : <AiOutlineHeart />} {isLiked ? 'Remover' : 'Favoritar'}
                            </button>
                            <button onClick={handlePlaylistClick} className="flex items-center gap-x-3 w-full px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-red-600/10 transition">
                                <MdPlaylistAdd /> Playlist
                            </button>
                            <button onClick={handleInfo} className="flex items-center gap-x-3 w-full px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-red-600/10 transition">
                                <AiOutlineInfoCircle /> Info
                            </button>
                            <div className="flex items-center gap-x-3 w-full px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-red-600/10 transition">
                                <OfflineButton song={data} size={16} />
                                <span>Offline</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={showModal} onChange={open => setShowModal(open)} title="> ADD_TO_PLAYLIST" description="Selecione o diretório:">
                <div className="flex flex-col gap-y-1">
                    {playlists.length === 0
                        ? <p className="text-neutral-500 text-[10px] font-mono py-4 text-center">NO_DATA_FOUND</p>
                        : playlists.map(pl => (
                            <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id)}
                                className="w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white hover:bg-red-600 hover:text-black transition truncate border border-white/5">
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