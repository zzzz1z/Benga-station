'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Header from "@/components/Header";
import SearchTabs from "./components/SearchTabs";
import SearchInput from "./components/SearchInput";
import { Song } from '@/types';

function SearchPage() {
  const searchParams = useSearchParams();
  const title = searchParams.get('title') ?? '';
  const yt = searchParams.get('yt') === '1';

  const [songs, setSongs] = useState<Song[]>([]);
  const [hasMore, setHasMore] = useState(false);

useEffect(() => {
  const params = new URLSearchParams({ limit: '50', offset: '0' });
  if (title) params.set('search', title);
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs?${params}`)
    .then(r => r.json())
    .then(data => {
      setSongs(Array.isArray(data) ? data : data.songs ?? []);
      setHasMore(false);
    });
}, [title]);

  return (
    <div className="bg-black h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header className="from-black">
        <div className="mb-2 flex flex-col gap-y-6">
          <div className="flex items-center gap-x-3">
            <div className="h-8 w-1 bg-red-600" />
            <h1 className="text-white text-4xl font-black uppercase tracking-tighter">
              Pesquisar<span className="text-red-600">.</span>
            </h1>
          </div>
          <SearchInput />
        </div>
      </Header>
      <SearchTabs title={title} songs={songs} hasMore={hasMore} triggerYT={yt} />
    </div>
  );
}

export default function Search() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}