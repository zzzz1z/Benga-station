'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from "@/components/Header";
import SettingsContent from "./components/SettingsContent";
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
const CACHE_KEY = 'benga_account_data';

const Account = () => {
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  })();

  const [likedSongs, setLikedSongs] = useState<any[]>(cached.likedSongs ?? []);
  const [playlists, setPlaylists] = useState<any[]>(cached.playlists ?? []);

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const [liked, pls] = await Promise.all([
      supabase.from('Músicas_Favoritas').select('*, Songs(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('Playlists').select('*').order('created_at', { ascending: false }).eq('user_id', user.id),
    ]);
    const newLiked = (liked.data ?? []).map((i: any) => ({ ...i.Songs }));
    const newPlaylists = pls.data ?? [];
    setLikedSongs(newLiked);
    setPlaylists(newPlaylists);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ likedSongs: newLiked, playlists: newPlaylists }));
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('benga:data-stale', handler);
    return () => window.removeEventListener('benga:data-stale', handler);
  }, [fetchData]);

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header />
      <SettingsContent likedSongs={likedSongs} playlists={playlists} />
    </div>
  );
};

export default Account;