'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { authedFetch } from '@/utils/api';

type LikedSongsContextType = {
  likedIds: Set<string>;
  isLoading: boolean;
  refreshLikedSongs: () => Promise<void>;
};

const LikedSongsContext = createContext<LikedSongsContextType | undefined>(undefined);

export const LikedSongsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const refreshLikedSongs = useCallback(async () => {
    if (!user?.id) { setLikedIds(new Set()); return; }
    setIsLoading(true);
    try {
      const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/likes`);
      if (res.ok) {
        const data = await res.json();
        setLikedIds(new Set((data as { song_id: string }[]).map(l => String(l.song_id))));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { refreshLikedSongs(); }, [refreshLikedSongs]);

  // re-fetch when data goes stale
  useEffect(() => {
    const handler = () => refreshLikedSongs();
    window.addEventListener('benga:data-stale', handler);
    return () => window.removeEventListener('benga:data-stale', handler);
  }, [refreshLikedSongs]);

  const value = useMemo(() => ({ likedIds, isLoading, refreshLikedSongs }), [likedIds, isLoading, refreshLikedSongs]);

  return <LikedSongsContext.Provider value={value}>{children}</LikedSongsContext.Provider>;
};

export const useLikedSongs = () => {
  const context = useContext(LikedSongsContext);
  if (!context) throw new Error('useLikedSongs must be used within LikedSongsProvider');
  return context;
};