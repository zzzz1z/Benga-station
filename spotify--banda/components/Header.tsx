"use client"

import { BiSearch } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { twMerge } from "tailwind-merge";
import useAuthModal from "@/hooks/useAuthModal";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";
import { FaUserAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import usePlayer from "@/hooks/usePlayer";
import { SlPlaylist } from "react-icons/sl";
import { FcLike } from "react-icons/fc";
import useUploadModal from "@/hooks/useUploadModal";
import { AiOutlineFileAdd } from "react-icons/ai";
import { usePageTransition } from "@/hooks/PageTransitionProvider";

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

const BUTTON_CUT = "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)";

const Header: React.FC<HeaderProps> = ({ children, className }) => {
  const { navigate, goBack, goForward } = usePageTransition();
  const authModal = useAuthModal();
  const player = usePlayer();
  const { user, userDetails } = useUser();
  const uploadModal = useUploadModal();

  const onClick = () => {
    if (!user) return authModal.onOpen("sign_up");
    return uploadModal.onOpen();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error(error.message); return; }
    player.reset();
    toast.success("TAS OFF! [SESSÃO ENCERRADA]");
    window.location.href = '/';
  };

  return (
    <div className={twMerge(`relative h-fit bg-neutral-900/50 p-6 overflow-hidden`, className)}>

      {/* Gamer HUD background */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.02) 3px, rgba(239,68,68,0.02) 4px)' }}
      />
      <div className="absolute top-0 left-0 right-0 h-px z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)' }}
      />

      <div className="relative z-20 w-full mb-4 flex items-center justify-between">

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-x-2 items-center">
          <button type="button" onClick={goBack}
            className="flex items-center justify-center bg-black/40 border border-red-500/30 hover:border-red-500 transition-all p-1"
            style={{ clipPath: BUTTON_CUT }}>
            <RxCaretLeft className="text-white" size={35} />
          </button>
          <button type="button" onClick={goForward}
            className="flex items-center justify-center bg-black/40 border border-red-500/30 hover:border-red-500 transition-all p-1"
            style={{ clipPath: BUTTON_CUT }}>
            <RxCaretRight className="text-white" size={35} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-x-2 items-center">
          {[
            { icon: HiHome, path: "/" },
            { icon: BiSearch, path: "/search" },
            ...(user ? [
              { icon: SlPlaylist, path: "/playlists" },
              { icon: FcLike, path: "/liked" },
            ] : []),
          ].map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(item.path)}
              className="p-2 bg-neutral-800 border border-red-500/20 text-white flex items-center justify-center hover:bg-red-500/20 transition-all"
              style={{ clipPath: BUTTON_CUT }}
            >
              <item.icon size={20} />
            </button>
          ))}

          {userDetails?.role === "admin" && (
            <button type="button" onClick={onClick}
              className="p-2 bg-red-600/20 border border-red-500 text-red-500 flex items-center justify-center"
              style={{ clipPath: BUTTON_CUT }}>
              <AiOutlineFileAdd size={20} />
            </button>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="flex justify-between items-center gap-x-4">
          {user ? (
            <div className="flex gap-x-4 items-center">
              <button onClick={() => navigate("/account")}
                className="bg-white p-2 flex items-center justify-center transition hover:scale-105 active:scale-95"
                style={{ clipPath: BUTTON_CUT }}>
                <FaUserAlt className="text-black" />
              </button>
              <button onClick={handleLogout}
                className="bg-red-600 px-6 py-2 text-white font-black uppercase text-xs tracking-widest hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                style={{ clipPath: BUTTON_CUT }}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => authModal.onOpen("sign_up")}
                className="bg-transparent text-neutral-400 font-bold uppercase text-[10px] tracking-[0.2em] hover:text-white transition">
                Registar
              </button>
              <button onClick={() => authModal.onOpen("sign_in")}
                className="bg-red-600 px-6 py-2 text-white font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                style={{ clipPath: BUTTON_CUT }}>
                Login
              </button>
            </>
          )}
        </div>
      </div>

      {children && <div className="relative z-20">{children}</div>}
    </div>
  );
};

export default Header;