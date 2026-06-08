'use client'

import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { authedFetch } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

interface LikedButtonProps {
  songId: string;
  initialLiked?: boolean;
}

const LikedButton: React.FC<LikedButtonProps> = ({ songId, initialLiked = false }) => {
  const router = useRouter();
  const authModal = useAuthModal();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(initialLiked);

  const id = String(songId);
  const isYoutube = id.startsWith('yt_');

  const handleClick = async () => {
    if (!user) return authModal.onOpen('sign_up');
    if (isYoutube) return;

    const method = isLiked ? 'DELETE' : 'POST';
const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/likes`, {
  method,
  body: JSON.stringify({ song_id: id }),
});

    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error ?? 'Erro ao atualizar favoritos');
    } else {
      setIsLiked(!isLiked);
      toast.success(isLiked ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
      router.refresh();
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