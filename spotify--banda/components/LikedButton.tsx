'use client'

import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

interface LikedButtonProps {
    songId: string;
}

const LikedButton: React.FC<LikedButtonProps> = ({ songId }) => {
    const router = useRouter();
    const { supabaseClient } = useSessionContext();
    const authModal = useAuthModal();
    const { user } = useUser();

    const [isLiked, setIsLiked] = useState(false);

    // Fetch liked status
    const fetchLikedStatus = useCallback(async () => {
        if (!user?.id) return;

        const { data, error } = await supabaseClient
            .from("Músicas_Favoritas")
            .select("*")
            .eq("user_id", user.id)
            .eq("song_id", songId)
            .maybeSingle();

        if (!error && data) {
            setIsLiked(true);
        }
    }, [songId, user?.id]);

    useEffect(() => {
        fetchLikedStatus();
    }, [fetchLikedStatus]);

    const handleClick = async () => {
        if (!user) {
            return authModal.onOpen('sign_up')
        }

        const action = isLiked ? "delete" : "insert";
        const query = supabaseClient.from("Músicas_Favoritas");

        const { error } = isLiked
            ? await query.delete().eq("user_id", user.id).eq("song_id", songId)
            : await query.insert({ song_id: songId, user_id: user.id });

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
            <button
                onClick={handleClick}
                className="flex items-center justify-center w-[30px] h-[30px] overflow-hidden flex-shrink-0"
            >
                {isLiked ? (
                    <AiFillHeart color="#A52A2A" size={25} />
                ) : (
                    <AiOutlineHeart color="white" size={25} />
                )}
            </button>
        </div>
    );
};

export default LikedButton;
