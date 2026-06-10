'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from "@/components/Header";
import SettingsContent from "./components/SettingsContent";
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

const Account = () => {
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [liked, pls] = await Promise.all([
      supabase.from('Músicas_Favoritas').select('*, Songs(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('Playlists').select('*').order('created_at', { ascending: false }).eq('user_id', user.id),
    ]);
    setLikedSongs((liked.data ?? []).map((i: any) => ({ ...i.Songs })));
    setPlaylists(pls.data ?? []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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