"use client"

import { useRouter } from "next/navigation";
import { BiSearch } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { twMerge } from "tailwind-merge";
import useAuthModal from "@/hooks/useAuthModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "@/hooks/useUser";
import Button from "./Botão";
import { FaUserAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import usePlayer from "@/hooks/usePlayer";
import { SlPlaylist } from "react-icons/sl";
import { FcLike } from "react-icons/fc";
import useUploadModal from "@/hooks/useUploadModal";
import { AiOutlineFileAdd } from "react-icons/ai";

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ children, className }) => {
  const router = useRouter();
  const authModal = useAuthModal();
  const player = usePlayer();
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const uploadModal = useUploadModal();

  const onClick = () => {
    if (!user?.user) {
      return authModal.onOpen("sign_up");
    }
    return uploadModal.onOpen();
  };

  const handleLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    player.reset();
    router.refresh();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Tas off!");
    }
  };

  return (
    <div
      className={twMerge(`
        h-fit
        bg-gradient-to-b 
        from-red-800
        p-6`,
        className
      )}
    >
      <div className="w-full mb-4 flex items-center justify-between">
        {/* Left nav on desktop */}
        <div className="hidden md:flex gap-x-2 items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition"
          >
            <RxCaretLeft className="text-white" size={35} />
          </button>

          <button
            type="button"
            onClick={() => router.forward()}
            className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition"
          >
            <RxCaretRight className="text-white" size={35} />
          </button>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden gap-x-2 items-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition"
          >
            <HiHome className="text-black" size={20} />
          </button>

          <button
            type="button"
            onClick={() => router.push("/search")}
            className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition"
          >
            <BiSearch className="text-black" size={20} />
          </button>

          {user?.userDetails?.role === "admin" && (
            <button
              type="button"
              onClick={onClick}
              className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition"
            >
              <AiOutlineFileAdd className="text-black" size={20} />
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex justify-between items-center gap-x-4">
          {user?.user ? (
            <>
              <div className="flex md:hidden gap-x-2 items-center">
                <button
                  type="button"
                  onClick={() => router.push("/playlists")}
                  className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition"
                >
                  <SlPlaylist className="text-black" size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/liked")}
                  className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition"
                >
                  <FcLike className="text-black" size={20} />
                </button>
              </div>

              <div className="flex gap-x-4 items-center">
                <Button
                  onClick={() => router.push("/account")}
                  className="bg-white"
                >
                  <FaUserAlt />
                </Button>

                <Button
                  onClick={handleLogout}
                  className="bg-white px-6 py-2"
                >
                  Sair
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={() => authModal.onOpen("sign_up")}
                className="bg-transparent text-neutral-300 font-medium"
              >
                Criar conta
              </Button>

              <Button
                onClick={() => authModal.onOpen("sign_in")}
                className="bg-red-700 px-6 py-2"
              >
                Iniciar sessão
              </Button>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default Header;
