'use client';

import { BiSearch } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { twMerge } from "tailwind-merge";
import useAuthModal from "@/hooks/useAuthModal";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";
import { FaUserAlt } from "react-icons/fa";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { AiOutlineFileAdd } from "react-icons/ai";
import toast from "react-hot-toast";
import usePlayer from "@/hooks/usePlayer";
import { SlPlaylist } from "react-icons/sl";
import { FcLike } from "react-icons/fc";
import useUploadModal from "@/hooks/useUploadModal";
import { usePageTransition } from "@/providers/PageTransitionProvider";
import { useEffect, useState } from "react";

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

const BUTTON_CUT = "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)";

const HeaderPulse = () => {
  const activeID = usePlayer(s => s.activeID);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setPlaying(!!activeID); }, [activeID]);

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10  duration-1000"
        style={{
          background: playing
            ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.9), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)',
          animation: playing ? 'headerGlow 2s ease-in-out infinite' : 'none',
          boxShadow: playing ? '0 0 12px rgba(239,68,68,0.6)' : 'none',
        }}
      />
      <style>{`
        @keyframes headerGlow {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 8px rgba(239,68,68,0.3); }
          50%       { opacity: 1;   box-shadow: 0 0 20px rgba(239,68,68,0.8); }
        }
        @keyframes scanDown {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
      `}</style>
    </>
  );
};

const Header: React.FC<HeaderProps> = ({ children, className }) => {
  const { navigate, goBack, goForward } = usePageTransition();
  const authModal   = useAuthModal();
  const player      = usePlayer();
  const { user, userDetails } = useUser();
  const uploadModal = useUploadModal();
  const activeID    = usePlayer(s => s.activeID);

  const handleUpload = () => {
    if (!user) return authModal.onOpen("sign_up");
    uploadModal.onOpen();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error(error.message); return; }
    player.reset();
    toast.success("TAS OFF! [SESSÃO ENCERRADA]");
    window.location.href = '/';
  };

  const NAV_ITEMS = [
    { icon: HiHome,     path: "/",          label: "Home" },
    { icon: BiSearch,   path: "/search",    label: "Search" },
    { icon: SlPlaylist, path: "/playlists", label: "Playlists" },
    { icon: FcLike,     path: "/liked",     label: "Favoritas" },
  ];

  const mobileNavBtn = (onClick: () => void, Icon: React.ElementType, label: string, extraClass = '') => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-500/15  ${extraClass}`}
      style={{ clipPath: BUTTON_CUT, touchAction: 'manipulation' }}
    >
      <Icon size={22} className="text-white" />
      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">{label}</span>
    </button>
  );

  return (
    <div
      className={twMerge(`relative h-fit bg-neutral-900/50 px-6 pb-6 overflow-hidden`, className)}
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 1.5rem)` }}
    >
      <HeaderPulse />

      <div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.02) 3px, rgba(239,68,68,0.02) 4px)',
          opacity: activeID ? 1 : 0.4,
          animation: activeID ? 'scanDown 8s linear infinite' : 'none',
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)' }} />

      <div className="relative z-20 w-full mb-4 flex items-center justify-between">

        {/* Desktop nav */}
        <div className="hidden md:flex gap-x-2 items-center">
          <button type="button" onClick={goBack}
            className="flex items-center justify-center bg-black/40 border border-red-500/30  p-1"
            style={{ clipPath: BUTTON_CUT }}>
            <RxCaretLeft className="text-white" size={35} />
          </button>
          <button type="button" onClick={goForward}
            className="flex items-center justify-center bg-black/40 border border-red-500/30  p-1"
            style={{ clipPath: BUTTON_CUT }}>
            <RxCaretRight className="text-white" size={35} />
          </button>
        </div>

        {/* Mobile nav — all buttons inline */}
        {user ? (
          <div className="flex md:hidden items-center gap-x-1 flex-1">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-500/15 "
                style={{ clipPath: BUTTON_CUT, touchAction: 'manipulation' }}
              >
                <item.icon size={20} className="text-white" />
                <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">{item.label}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate('/account')}
              className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-500/15 "
              style={{ clipPath: BUTTON_CUT, touchAction: 'manipulation' }}
            >
              <FaUserAlt size={18} className="text-white" />
              <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">Perfil</span>
            </button>

            {userDetails?.role === 'admin' && (
              <button
                type="button"
                onClick={handleUpload}
                className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-500/15 "
                style={{ clipPath: BUTTON_CUT, touchAction: 'manipulation' }}
              >
                <AiOutlineFileAdd size={20} className="text-red-400" />
                <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">Upload</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-600/30"
              style={{ clipPath: BUTTON_CUT, touchAction: 'manipulation' }}
            >
              <RiLogoutBoxRLine size={20} className="text-red-500" />
              <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex md:hidden items-center gap-x-1 flex-1">
            {NAV_ITEMS.slice(0, 2).map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-500/15 "
                style={{ clipPath: BUTTON_CUT, touchAction: 'manipulation' }}
              >
                <item.icon size={20} className="text-white" />
                <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => authModal.onOpen("sign_in")}
              className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-red-600/20 border border-red-600/50"
              style={{ clipPath: BUTTON_CUT, touchAction: 'manipulation' }}
            >
              <FaUserAlt size={18} className="text-red-400" />
              <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">Login</span>
            </button>
          </div>
        )}

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-x-4 ml-3">
          {user ? (
            <>
              <button onClick={() => navigate("/account")}
                className="bg-white p-2 flex items-center justify-center "
                style={{ clipPath: BUTTON_CUT }}>
                <FaUserAlt className="text-black" />
              </button>
              <button onClick={handleLogout}
                className="bg-red-600 px-6 py-2 text-white font-black uppercase text-xs tracking-widest  shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                style={{ clipPath: BUTTON_CUT }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => authModal.onOpen("sign_up")}
                className="bg-transparent text-neutral-400 font-bold uppercase text-[10px] tracking-[0.2em] transition">
                Registar
              </button>
              <button onClick={() => authModal.onOpen("sign_in")}
                className="bg-red-600 px-6 py-2 text-white font-black uppercase text-xs tracking-widest  shadow-[0_0_20px_rgba(220,38,38,0.3)]"
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