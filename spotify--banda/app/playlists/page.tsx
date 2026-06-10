'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from "@/components/Header";
import Image from "next/image";
import ImportPlaylistButton from "@/components/ImportPlaylistButton";
import PlaylistContent from "./components/PlaylistContent";
import { authedFetch } from '@/utils/api';
import { useUser } from '@/hooks/useUser';
import { Playlist } from '@/types';
import PlaylistDetails from './components/PlaylistDetails';

const CACHE_KEY = 'benga_playlists_data';

const PlaylistsPage = () => {
  const { user, isLoading } = useUser();
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
  })();

  const [playlists, setPlaylists] = useState<Playlist[]>(cached);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');

  const fetchData = useCallback(async () => {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlist/user-playlists`);
    if (!res.ok) return;
    const data = await res.json();
    const result: Playlist[] = (data ?? []).map(({ playlist_songs, ...p }: any) => p);
    setPlaylists(result);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch {}
  }, []);

  useEffect(() => {
    if (!isLoading && user) fetchData();
  }, [isLoading, user, fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('benga:data-stale', handler);
    return () => window.removeEventListener('benga:data-stale', handler);
  }, [fetchData]);

  if (selectedId) return <PlaylistDetails id={selectedId} />;

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header>
        <div className="mt-20">
          <div className="flex flex-col md:flex-row items-center gap-x-5">
            <div className="relative h-32 w-32 lg:h-44 lg:w-44 flex-shrink-0">
              <div
                className="absolute inset-0 rounded-sm blur-xl opacity-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.8), transparent 70%)' }}
              />
              <Image
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt='Lista de Músicas'
                className="object-cover relative z-10"
                src='/images/likedit.png'
                priority
              />
            </div>
            <div className="flex flex-col gap-y-3 mt-4 md:mt-0 items-center md:items-start w-full">
              <p className="hidden md:block font-bold text-xs uppercase tracking-widest text-red-500">
                Biblioteca
              </p>
              <h1
                className="text-white text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight"
                style={{ textShadow: '0 0 40px rgba(239,68,68,0.25)' }}
              >
                Minhas Playlists
              </h1>
              <div className="flex justify-center md:justify-start w-full">
                <ImportPlaylistButton />
              </div>
            </div>
          </div>
        </div>
      </Header>
      <PlaylistContent playlists={playlists} />
    </div>
  );
};

export default PlaylistsPage;