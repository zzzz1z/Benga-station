'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Playlist } from '@/types';

const supabase = createClient();

type PlaylistContextType = {
  playlists: Playlist[];
  isLoading: boolean;
  refreshPlaylists: () => Promise<void>;
};

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPlaylists = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('Playlists')
      .select('*, playlist_songs(Songs(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPlaylists(
        data.map((p: any) => ({
          ...p,
          songs: (p.playlist_songs ?? []).map((ps: any) => ps.Songs).filter(Boolean),
        }))
      );
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  const value = useMemo(() => ({ playlists, isLoading, refreshPlaylists }), [playlists, isLoading, refreshPlaylists]);

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
};

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (!context) throw new Error('usePlaylists must be used within PlaylistProvider');
  return context;
};