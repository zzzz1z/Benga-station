'use client';

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
import { usePageTransition } from "@/providers/PageTransitionProvider";
import { useEffect, useRef, useState } from "react";
import { RiMenuUnfoldLine } from "react-icons/ri";
import HeaderDrawer from "./HeaderDrawer";

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

const BUTTON_CUT = "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)";

// ── pulse line — reads player state ──────────────────────────────────────────
const HeaderPulse = () => {
  const isPlaying = usePlayer(s => !!s.activeID && s.playCount >= 0);
  const activeID  = usePlayer(s => s.activeID);
  const [playing, setPlaying] = useState(false);

  // we need actual isPlaying — read from a ref pattern via zustand
  // simplest: subscribe to player and track via audio events is complex here
  // instead we pulse whenever activeID exists (song loaded)
  useEffect(() => {
    setPlaying(!!activeID);
  }, [activeID]);

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10 transition-all duration-1000"
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
        @keyframes slashReveal {
          0%   { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); opacity: 0; }
          100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
        }
        @keyframes itemSlideIn {
          0%   { opacity: 0; transform: translateX(40px) skewX(-5deg); }
          100% { opacity: 1; transform: translateX(0)    skewX(0deg); }
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeID = usePlayer(s => s.activeID);

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

  const NAV_ITEMS = [
    { icon: HiHome,    path: "/",          label: "Home" },
    { icon: BiSearch,  path: "/search",    label: "Search" },
    { icon: SlPlaylist,path: "/playlists", label: "Playlists" },
    { icon: FcLike,    path: "/liked",     label: "Favoritas" },
  ];

  return (
    <>
      <HeaderDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        isAdmin={userDetails?.role === 'admin'}
        onUpload={() => { setDrawerOpen(false); onClick(); }}
        onLogout={() => { setDrawerOpen(false); handleLogout(); }}
        onNavigate={(path) => { setDrawerOpen(false); navigate(path); }}
      />

      <div className={twMerge(`relative h-fit bg-neutral-900/50 p-6 overflow-hidden`, className)}>

        <HeaderPulse />

        {/* scan line bg — animates when playing */}
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
              className="flex items-center justify-center bg-black/40 border border-red-500/30 transition-all p-1"
              style={{ clipPath: BUTTON_CUT }}>
              <RxCaretLeft className="text-white" size={35} />
            </button>
            <button type="button" onClick={goForward}
              className="flex items-center justify-center bg-black/40 border border-red-500/30 transition-all p-1"
              style={{ clipPath: BUTTON_CUT }}>
              <RxCaretRight className="text-white" size={35} />
            </button>
          </div>

          {/* Mobile nav — 4 big buttons spread full width */}
          {user && (
            <div className="flex md:hidden items-center gap-x-2 flex-1">
              {NAV_ITEMS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-500/15 active:bg-red-500/20 active:border-red-500/60 transition-all"
                  style={{ clipPath: BUTTON_CUT }}
                >
                  <item.icon size={22} className="text-white" />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {!user && (
            <div className="flex md:hidden items-center gap-x-2 flex-1">
              {NAV_ITEMS.slice(0, 2).map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex-1 flex flex-col items-center justify-center gap-y-1 py-3 bg-neutral-900/80 border border-red-500/15 active:bg-red-500/20 active:border-red-500/60 transition-all"
                  style={{ clipPath: BUTTON_CUT }}
                >
                  <item.icon size={22} className="text-white" />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-x-3 ml-3">
            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-x-4">
              {user ? (
                <>
                  <button onClick={() => navigate("/account")}
                    className="bg-white p-2 flex items-center justify-center transition active:scale-95"
                    style={{ clipPath: BUTTON_CUT }}>
                    <FaUserAlt className="text-black" />
                  </button>
                  <button onClick={handleLogout}
                    className="bg-red-600 px-6 py-2 text-white font-black uppercase text-xs tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
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
                    className="bg-red-600 px-6 py-2 text-white font-black uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    style={{ clipPath: BUTTON_CUT }}>
                    Login
                  </button>
                </>
              )}
            </div>

            {/* Mobile — drawer trigger */}
            {user && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden flex items-center justify-center w-12 h-12 bg-neutral-900/80 border border-red-500/30 active:border-red-500 active:bg-red-500/10 transition-all"
                style={{ clipPath: BUTTON_CUT }}
              >
                <RiMenuUnfoldLine size={22} className="text-red-400" />
              </button>
            )}

            {!user && (
              <div className="md:hidden flex items-center gap-x-2">
                <button onClick={() => authModal.onOpen("sign_in")}
                  className="bg-red-600 px-4 py-2 text-white font-black uppercase text-xs tracking-widest transition-all"
                  style={{ clipPath: BUTTON_CUT }}>
                  Login
                </button>
              </div>
            )}
          </div>
        </div>

        {children && <div className="relative z-20">{children}</div>}
      </div>
    </>
  );
};

export default Header;