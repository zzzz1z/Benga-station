'use client';

import Image from 'next/image';
import { FaPlay } from 'react-icons/fa';
import { MdOutlineNotInterested, MdPlaylistAdd } from 'react-icons/md';
import { AiFillHeart, AiOutlineHeart, AiOutlineInfoCircle } from 'react-icons/ai';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import useAuthModal from '@/hooks/useAuthModal';
import { Playlist } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';
import { authedFetch } from '@/utils/api';

export interface YTResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface YTSearchItemProps {
  result: YTResult;
  onPlay: (result: YTResult) => void;
  isLoading: boolean;
  isReady: boolean;
  isUnavailable: boolean;
  isPlaying: boolean;
}

const YTSearchItem: React.FC<YTSearchItemProps> = ({
  result, onPlay, isLoading, isReady, isUnavailable, isPlaying
}) => {
  const { user } = useUser();
  const authModal = useAuthModal();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const songId = `yt_${result.videoId}`;

  useEffect(() => {
    if (!user?.id) return;
    authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/likes?songId=${songId}`)
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
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/likes`, {
      method,
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
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlist/user-playlists`);
    const json = await res.json();
    setPlaylists(json.playlists ?? json ?? []);
    setShowMenu(false);
    setShowModal(true);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlist/add-song`, {
      method: 'POST',
      body: JSON.stringify({
        playlistId,
        song: {
          title: result.title,
          author: result.artist,
          source: 'youtube',
          youtube_video_id: result.videoId,
          image_path: result.thumbnail,
        },
      }),
    });
    if (res.status === 409) toast.error('Música já está na playlist');
    else if (!res.ok) toast.error('Erro ao adicionar música');
    else toast.success('Adicionado à playlist!');
    setShowModal(false);
  };

  const handleInfo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { authModal.onOpen('sign_up'); return; }
    setShowMenu(false);
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/apiupsert-youtube`, {
      method: 'POST',
      body: JSON.stringify({
        title: result.title,
        author: result.artist,
        youtube_video_id: result.videoId,
        image_path: result.thumbnail,
      }),
    });

  };

  return (
    <>
      <div
        className={`flex items-center gap-x-3 w-full p-2 rounded-md transition group
          ${isUnavailable ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-800 cursor-pointer'}`}
        onClick={() => !isUnavailable && onPlay(result)}
      >
        <div className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-neutral-700">
          {result.thumbnail && (
            <Image src={result.thumbnail} alt={result.title} fill className="object-cover" unoptimized />
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isPlaying ? 'text-red-400' : isUnavailable ? 'text-neutral-500' : 'text-white'}`}>
            {result.title}
          </p>
          <p className="text-xs text-neutral-400 truncate">
            {result.artist}
            {isUnavailable && <span className="ml-2 text-neutral-600">— indisponível</span>}
          </p>
        </div>

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
          <div className="flex items-center justify-center w-5 h-5">
            {isLoading
              ? <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              : isUnavailable
              ? <MdOutlineNotInterested size={14} className="text-neutral-600" />
              : <FaPlay size={12} className={`transition ${isPlaying ? 'text-red-400' : 'text-neutral-400 group-hover:text-white'}`} />
            }
          </div>
        </div>

        <div
          className="flex md:hidden items-center gap-x-2 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-5 h-5">
            {isLoading
              ? <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              : isUnavailable
              ? <MdOutlineNotInterested size={14} className="text-neutral-600" />
              : isPlaying
              ? <FaPlay size={12} className="text-red-400" />
              : null
            }
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="text-neutral-400 p-2 flex items-center justify-center"
            >
              <BsThreeDotsVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden border border-neutral-700">
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

export default YTSearchItem;