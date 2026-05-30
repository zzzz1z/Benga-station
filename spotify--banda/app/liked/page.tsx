'use client';

import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import LikedContent from "./components/LikedContent";
import Image from "next/image";
import { createClient } from '@/utils/supabase/client';
import { Song } from '@/types';

const supabase = createClient();

const Liked = () => {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('Músicas_Favoritas')
        .select('*, Songs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setSongs((data ?? []).map((i: any) => ({ ...i.Songs }))));
    });
  }, []);

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header>
        <div className="mt-6 mb-2">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-x-6 gap-y-4">
            <div className="relative flex-shrink-0 h-32 w-32 lg:h-44 lg:w-44">
              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-red-500 z-10" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-red-500 z-10" />
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-red-500 z-10" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-red-500 z-10" />
              <div className="absolute inset-0 blur-xl opacity-30 pointer-events-none z-0"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.8), transparent 70%)' }} />
              <Image
                fill priority
                sizes="(max-width: 768px) 128px, 176px"
                alt="Músicas Favoritas"
                className="object-cover relative z-[1]"
                src="/images/likedit.png"
              />
            </div>
            <div className="flex flex-col gap-y-2 items-center md:items-start">
              <p className="text-red-500/60 font-mono text-[9px] uppercase tracking-[0.3em]">
                ▶ BIBLIOTECA // FAVORITAS
              </p>
              <h1
                className="text-white text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-center md:text-left"
                style={{ textShadow: '0 0 40px rgba(239,68,68,0.25)' }}
              >
                Músicas<br className="md:hidden" /> Favoritas
              </h1>
              <div className="flex items-center gap-x-2 mt-1">
                <div className="h-px w-6 bg-red-500/40" />
                <span className="text-red-600/30 font-mono text-[8px] uppercase tracking-[0.3em]">
                  {songs.length} TRACKS_LOADED
                </span>
                <div className="h-px w-6 bg-red-500/40" />
              </div>
            </div>

            
          </div>
        </div>
      </Header>
      <LikedContent songs={songs} />
    </div>
  );
};

export default Liked;