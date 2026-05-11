'use client'

import useLoadImage from "@/hooks/useLoadImage";
import usePlayer from "@/hooks/usePlayer";
import { Song, Playlist } from "@/types";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { MdPlaylistAdd } from "react-icons/md";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useUser } from "@/hooks/useUser";
import useAuthModal from "@/hooks/useAuthModal";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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

  // close menu on outside click
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
        onClick={handleClick}
        className="flex items-center gap-4 cursor-pointer hover:bg-neutral-800/50 p-2 rounded-md w-full group"
      >
        <div className="relative rounded-md h-14 w-16 flex-shrink-0 overflow-hidden">
          <Image
            priority fill
            sizes="(max-width: 968px) 100vw, (max-width: 1400px) 70vw, 53vw"
            src={imageUrl ?? '/images/likedit.png'}
            alt={data.title ?? 'Media Item'}
            className="object-cover"
          />
        </div>

        <div className="flex flex-col w-full gap-y-1 min-w-0">
          <p className="text-white truncate w-full">{data.title}</p>
          <p className="text-neutral-400 text-sm">{data.author}</p>
        </div>

        {/* Desktop hover buttons */}
        <div
          className="hidden md:flex items-center gap-x-3 flex-shrink-0 pr-2 opacity-0 group-hover:opacity-100 transition"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={handleLike} className="text-neutral-400 hover:text-white flex items-center justify-center w-5 h-5">
            {isLiked ? <AiFillHeart size={16} className="text-red-500" /> : <AiOutlineHeart size={16} />}
          </button>
          <button onClick={handlePlaylistClick} className="text-neutral-400 hover:text-white flex items-center justify-center w-5 h-5">
            <MdPlaylistAdd size={18} />
          </button>
          <button onClick={handleInfo} className="text-neutral-400 hover:text-white flex items-center justify-center w-5 h-5">
            <AiOutlineInfoCircle size={16} />
          </button>
        </div>

        {/* Mobile three-dot menu */}
        <div
          className="relative md:hidden flex-shrink-0"
          ref={menuRef}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setShowMenu(prev => !prev)}
            className="text-neutral-400 p-2 flex items-center justify-center"
          >
            <BsThreeDotsVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 bottom-full mb-1 w-44 bg-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden border border-neutral-700">
              <button
                onClick={handleLike}
                className="flex items-center gap-x-3 w-full px-4 py-3 text-sm text-white hover:bg-neutral-700 transition"
              >
                {isLiked
                  ? <AiFillHeart size={16} className="text-red-500" />
                  : <AiOutlineHeart size={16} className="text-neutral-400" />
                }
                {isLiked ? 'Remover favorito' : 'Adicionar favorito'}
              </button>
              <button
                onClick={handlePlaylistClick}
                className="flex items-center gap-x-3 w-full px-4 py-3 text-sm text-white hover:bg-neutral-700 transition"
              >
                <MdPlaylistAdd size={16} className="text-neutral-400" />
                Adicionar à playlist
              </button>
              <button
                onClick={handleInfo}
                className="flex items-center gap-x-3 w-full px-4 py-3 text-sm text-white hover:bg-neutral-700 transition"
              >
                <AiOutlineInfoCircle size={16} className="text-neutral-400" />
                Ver detalhes
              </button>
            </div>
          )}
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

export default MediaItem;