'use client';

import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import SettingsContent from "./components/SettingsContent";
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

const Account = () => {
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase.from('Músicas_Favoritas').select('*, Songs(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('playlists').select('*').order('created_at', { ascending: false }),
      ]).then(([liked, playlists]) => {
        setLikedSongs((liked.data ?? []).map((i: any) => ({ ...i.Songs })));
        setPlaylists(playlists.data ?? []);
      });
    });
  }, []);

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <Header />
      <SettingsContent likedSongs={likedSongs} playlists={playlists} />
    </div>
  );
};

export default Account;