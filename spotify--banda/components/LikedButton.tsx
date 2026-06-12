'use client';

import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { authedFetch } from "@/utils/api";
import toast from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { markDataStale } from "./FloatingRefreshButton";


export interface YTResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface LikedButtonProps {
  songId: string;
  result: YTResult;
}

const LikedButton: React.FC<LikedButtonProps> = ({ songId, result }) => {
  const authModal = useAuthModal();
  const { user } = useUser();
  const { likedIds, refreshLikedSongs } = useLikedSongs();

  const id = String(songId);
  const isYoutube = id.startsWith('yt_');
  const isLiked = likedIds.has(id);

  const handleClick = async () => {
    if (!user) return authModal.onOpen('sign_up');
    
    
    if (isYoutube) {

    const upsertRes = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs/upsert-youtube`, {
        method: 'POST',
        body: JSON.stringify({
            title: result.title,
            author: result.artist,
            youtube_video_id: result.videoId,
            image_path: result.thumbnail,
        })
    });
    const { id: realSongId } = await upsertRes.json();
    if (!realSongId) { toast.error('Erro ao processar música'); return; }
      }
      

    const method = isLiked ? 'DELETE' : 'POST';
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/likes`, {
      method,
      body: JSON.stringify({ song_id: id }),
    });

    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error ?? 'Erro ao atualizar favoritos');
    } else {
      toast.success(isLiked ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
      markDataStale();
      await refreshLikedSongs();
    }
  };

  return (
    <div className="flex items-center justify-center w-full max-w-[40px] h-full">
      <button onClick={handleClick} className="flex items-center justify-center w-[30px] h-[30px] overflow-hidden flex-shrink-0">
        {isLiked ? <AiFillHeart color="#A52A2A" size={25} /> : <AiOutlineHeart color="white" size={25} />}
      </button>
    </div>
  );
};

export default LikedButton;