'use client'

import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

const supabase = createClient();

interface LikedButtonProps {
  songId: string;
}

const LikedButton: React.FC<LikedButtonProps> = ({ songId }) => {
  const router = useRouter();
  const authModal = useAuthModal();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);

  const fetchLikedStatus = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("Músicas_Favoritas")
      .select("*")
      .eq("user_id", user.id)
      .eq("song_id", songId)
      .maybeSingle();

    if (!error && data) setIsLiked(true);
  }, [songId, user?.id]);

  useEffect(() => {
    fetchLikedStatus();
  }, [fetchLikedStatus]);

  const handleClick = async () => {
    if (!user) return authModal.onOpen('sign_up');

    const { error } = isLiked
      ? await supabase.from("Músicas_Favoritas").delete().eq("user_id", user.id).eq("song_id", songId)
      : await supabase.from("Músicas_Favoritas").insert({ song_id: songId, user_id: user.id });

    if (error) {
      toast.error(error.message);
    } else {
      setIsLiked(!isLiked);
      toast.success(isLiked ? "Removido dos favoritos" : "Adicionado aos favoritos!");
    }

    router.refresh();
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