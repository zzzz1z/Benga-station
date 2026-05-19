'use client';

import { useEffect, useState } from "react";
import { FaUserAlt } from "react-icons/fa";
import { AiOutlineFileAdd, AiOutlineClose } from "react-icons/ai";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { HiLightningBolt } from "react-icons/hi";

interface HeaderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isAdmin: boolean;
  onUpload: () => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const SLASH_CUT = "polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)";

const HeaderDrawer: React.FC<HeaderDrawerProps> = ({
  isOpen, onClose, user, isAdmin, onUpload, onLogout, onNavigate,
}) => {
  const [mounted, setMounted]     = useState(false);
  const [visible, setVisible]     = useState(false);
  const [itemsIn, setItemsIn]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // stagger items in after drawer slides
      setTimeout(() => setItemsIn(true), 150);
    } else {
      setItemsIn(false);
      setTimeout(() => setVisible(false), 400);
    }
  }, [isOpen]);

  if (!mounted || !visible) return null;

  const items = [
    {
      icon: FaUserAlt,
      label: 'Perfil',
      sub: user?.email ?? '',
      action: () => onNavigate('/account'),
      color: 'text-white',
      border: 'border-red-500/20',
    },
    ...(isAdmin ? [{
      icon: AiOutlineFileAdd,
      label: 'Upload',
      sub: 'Adicionar música',
      action: onUpload,
      color: 'text-red-400',
      border: 'border-red-500/40',
    }] : []),
    {
      icon: RiLogoutBoxRLine,
      label: 'Logout',
      sub: 'Encerrar sessão',
      action: onLogout,
      color: 'text-red-500',
      border: 'border-red-600/40',
    },
  ];

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      {/* drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[90] w-[280px] flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0d0505 100%)',
          borderLeft: '1px solid rgba(239,68,68,0.2)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 3px)' }} />

        {/* diagonal slash decoration */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.8), transparent)', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }} />
        <div className="absolute top-20 -left-10 w-40 h-[1px] bg-red-600/20 rotate-[35deg]" />
        <div className="absolute top-32 -left-10 w-40 h-[1px] bg-red-600/10 rotate-[35deg]" />

        {/* header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-x-2">
            <HiLightningBolt size={14} className="text-red-500 animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-red-500/60">Menu</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-600 active:text-white transition p-1"
          >
            <AiOutlineClose size={18} />
          </button>
        </div>

        {/* user badge */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-x-3">
            <div className="w-10 h-10 bg-red-900/30 border border-red-500/30 flex items-center justify-center flex-shrink-0"
              style={{ clipPath: SLASH_CUT }}>
              <FaUserAlt size={14} className="text-red-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-white text-xs font-black uppercase tracking-tight truncate">
                {user?.email?.split('@')[0] ?? 'User'}
              </p>
              <p className="text-neutral-600 text-[9px] font-mono truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* nav items */}
        <div className="flex flex-col flex-1 px-4 py-4 gap-y-2">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className={`flex items-center gap-x-4 px-4 py-4 border transition-all active:scale-95 text-left w-full
                ${item.border} bg-white/[0.02] active:bg-red-500/10`}
              style={{
                clipPath: SLASH_CUT,
                opacity: itemsIn ? 1 : 0,
                transform: itemsIn ? 'translateX(0) skewX(0deg)' : 'translateX(50px) skewX(-3deg)',
                transition: `opacity 0.35s ease ${i * 0.07}s, transform 0.35s cubic-bezier(0.32,0.72,0,1) ${i * 0.07}s`,
              }}
            >
              <div className={`flex-shrink-0 ${item.color}`}>
                <item.icon size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-black uppercase tracking-tight ${item.color}`}>{item.label}</span>
                <span className="text-neutral-600 text-[9px] font-mono truncate">{item.sub}</span>
              </div>
              {/* slash accent */}
              <div className="ml-auto text-red-600/20 font-mono text-xs">›</div>
            </button>
          ))}
        </div>

        {/* bottom decoration */}
        <div className="px-5 py-4 border-t border-white/5">
          <p className="text-[8px] font-mono text-red-600/20 uppercase tracking-[0.3em]">
            // SYSTEM_AUTHENTICATED
          </p>
        </div>

        {/* bottom slash decorations */}
        <div className="absolute bottom-20 -right-10 w-40 h-[1px] bg-red-600/20 rotate-[35deg]" />
        <div className="absolute bottom-32 -right-10 w-40 h-[1px] bg-red-600/10 rotate-[35deg]" />
      </div>
    </>
  );
};

export default HeaderDrawer;