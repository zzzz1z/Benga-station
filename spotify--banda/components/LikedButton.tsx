'use client';

import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { authedFetch } from "@/utils/api";
import toast from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { markDataStale } from "./FloatingRefreshButton";

interface LikedButtonProps {
  songId: string;
}

const LikedButton: React.FC<LikedButtonProps> = ({ songId }) => {
  const authModal = useAuthModal();
  const { user } = useUser();
  const { likedIds, refreshLikedSongs } = useLikedSongs();

  const id = String(songId);
  const isYoutube = id.startsWith('yt_');
  const isLiked = likedIds.has(id);

  const handleClick = async () => {
    if (!user) return authModal.onOpen('sign_up');
    

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