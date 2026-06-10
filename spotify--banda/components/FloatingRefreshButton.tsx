'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { HiSignal } from 'react-icons/hi2';
import usePlayer from '@/hooks/usePlayer';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useRefresh } from '@/hooks/useRefresh';

export function markDataStale() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('benga:data-stale'));
  }
}

const FloatingRefreshButton = () => {
  const pathname = usePathname();
  const { activeID } = usePlayer();
  const { refreshPlaylists } = usePlaylists();
  const { triggerRefresh } = useRefresh();
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  const bottomClass = activeID ? 'bottom-28 md:bottom-24' : 'bottom-6';

  useEffect(() => {
    const handler = () => {
      setIsStale(true);
      setChangeCount(c => c + 1);
    };
    window.addEventListener('benga:data-stale', handler);
    return () => window.removeEventListener('benga:data-stale', handler);
  }, []);

  useEffect(() => {
    setIsStale(false);
    setChangeCount(0);
  }, [pathname]);

const handleRefresh = useCallback(async () => {
  if (isRefreshing) return;
  setIsRefreshing(true);
  await refreshPlaylists();
  markDataStale();
  await new Promise(r => setTimeout(r, 800));
  setIsStale(false);
  setChangeCount(0);
  setIsRefreshing(false);
  setRefreshed(true);
  setTimeout(() => setRefreshed(false), 1500);
}, [isRefreshing, refreshPlaylists]);

  return (
    <button
      onClick={handleRefresh}
      title={isStale ? `${changeCount} alteração(ões) — atualizar` : 'Atualizar dados'}
      className={`
        fixed right-4 z-50 duration-300
        ${bottomClass}
        ${isStale ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}
      `}
    >
      <div
        className={`
          relative flex items-center justify-center w-10 h-10
          border bg-neutral-950 duration-300
          ${isStale ? 'border-red-500/80' : refreshed ? 'border-green-500/80' : 'border-red-900/60'}
        `}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          boxShadow: isStale
            ? '0 0 16px rgba(239,68,68,0.4)'
            : refreshed
            ? '0 0 16px rgba(74,222,128,0.4)'
            : 'none',
        }}
      >
        <HiSignal
          size={16}
          className={`
            transition-colors duration-300
            ${isRefreshing ? 'text-red-400 animate-pulse'
              : refreshed ? 'text-green-400'
              : isStale ? 'text-red-500'
              : 'text-neutral-500'}
          `}
        />
        {isStale && !isRefreshing && (
          <span className="absolute inset-0 border border-red-500/40 animate-ping" />
        )}
        {refreshed && (
          <span className="absolute inset-0 border border-green-500/40 animate-ping" />
        )}
        {isStale && changeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black flex items-center justify-center"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          >
            {changeCount > 9 ? '9+' : changeCount}
          </span>
        )}
      </div>
      {(isStale || refreshed) && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap">
          <span
            className={`text-[9px] font-black uppercase tracking-widest bg-neutral-950 border px-2 py-1 ${
              refreshed ? 'text-green-400 border-green-900/40' : 'text-red-400 border-red-900/40'
            }`}
            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}
          >
            {refreshed ? '✓ Atualizado' : 'Atualizar'}
          </span>
        </div>
      )}
    </button>
  );
};

export default FloatingRefreshButton;