'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { HiSignal } from 'react-icons/hi2';
import usePlayer from '@/hooks/usePlayer';

// Global event bus — fire this anywhere in the app when data changes
export function markDataStale() {
  window.dispatchEvent(new CustomEvent('benga:data-stale'));
}

const FloatingRefreshButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { activeID } = usePlayer();
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  // Position above player if a song is active
  const bottomClass = activeID ? 'bottom-28 md:bottom-24' : 'bottom-6';

  useEffect(() => {
    const handler = () => {
      setIsStale(true);
      setChangeCount(c => c + 1);
    };
    window.addEventListener('benga:data-stale', handler);
    return () => window.removeEventListener('benga:data-stale', handler);
  }, []);

  // Reset stale state on route change (fresh data loaded)
  useEffect(() => {
    setIsStale(false);
    setChangeCount(0);
  }, [pathname]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    router.refresh();
    // Give Next.js a moment then clear state
    await new Promise(r => setTimeout(r, 800));
    setIsStale(false);
    setChangeCount(0);
    setIsRefreshing(false);
  }, [isRefreshing, router]);

  return (
    <button
      onClick={handleRefresh}
      title={isStale ? `${changeCount} alteração(ões) — atualizar` : 'Atualizar dados'}
      className={`
        fixed right-4 z-50 transition-all duration-300
        ${bottomClass}
        ${isStale
          ? 'opacity-100 scale-100'
          : 'opacity-20 scale-90 hover:opacity-60 hover:scale-95'
        }
      `}
    >
      <div
        className={`
          relative flex items-center justify-center w-10 h-10
          border border-red-900/60 bg-neutral-950
          ${isStale ? 'border-red-500/80' : ''}
        `}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          boxShadow: isStale ? '0 0 16px rgba(239,68,68,0.4)' : 'none',
        }}
      >
        <HiSignal
          size={16}
          className={`
            transition-colors duration-300
            ${isRefreshing ? 'text-red-400 animate-pulse' : isStale ? 'text-red-500' : 'text-neutral-500'}
          `}
        />

        {/* Pulsing ring when stale */}
        {isStale && !isRefreshing && (
          <span className="absolute inset-0 rounded-none border border-red-500/40 animate-ping" />
        )}

        {/* Change count badge */}
        {isStale && changeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black flex items-center justify-center"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          >
            {changeCount > 9 ? '9+' : changeCount}
          </span>
        )}
      </div>

      {/* Label — only when stale */}
      {isStale && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap">
          <span
            className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-neutral-950 border border-red-900/40 px-2 py-1"
            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}
          >
            Atualizar
          </span>
        </div>
      )}
    </button>
  );
};

export default FloatingRefreshButton;