'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from "@/components/Header";
import SettingsContent from "./components/SettingsContent";
import { authedFetch } from '@/utils/api';
import { Song, Playlist } from '@/types';

const CACHE_KEY = 'benga_account_data';

const Account = () => {
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  })();

  const [likedSongs, setLikedSongs] = useState<Song[]>(cached.likedSongs ?? []);
  const [playlists, setPlaylists] = useState<Playlist[]>(cached.playlists ?? []);
  const [userDetails, setUserDetails] = useState<any>(cached.userDetails ?? null);

  const fetchData = useCallback(async () => {
    const [accountRes, userRes] = await Promise.all([
      authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account`),
      authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`),
    ]);
    if (!accountRes.ok || !userRes.ok) return;
    const { likedSongs: ls, playlists: pls } = await accountRes.json();
    const ud = await userRes.json();
    setLikedSongs(ls ?? []);
    setPlaylists(pls ?? []);
    setUserDetails(ud);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ likedSongs: ls, playlists: pls, userDetails: ud }));
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
      <SettingsContent likedSongs={likedSongs} playlists={playlists} userDetails={userDetails} />
    </div>
  );
};

export default Account;