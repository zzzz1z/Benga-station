'use client';

import LikedButton from "@/components/LikedButton";
import MediaItem from "@/components/MediaItem";
import useOnPlay, { getSongPlayerId } from "@/hooks/useOnPlay";
import { useUser } from "@/hooks/useUser";
import { Song } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { MdMusicOff } from "react-icons/md";
import { HiHeart } from "react-icons/hi";

const supabase = createClient();
const CACHE_KEY = 'benga_liked_songs';

const SLASH_CUT = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";

const LikedContent: React.FC = () => {
  const router = useRouter();
  const { isLoading, user } = useUser();
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
  })();
  const [songs, setSongs] = useState<Song[]>(cached);
  const [mounted, setMounted] = useState(false);
  const onPlay = useOnPlay(songs);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/');
  }, [isLoading, user, router]);

  const fetchSongs = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('Músicas_Favoritas')
      .select('Songs(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      const result = data.map((item: any) => item.Songs).filter(Boolean);
      setSongs(result);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchSongs();
  }, [user?.id, fetchSongs]);

  useEffect(() => {
    const handler = () => fetchSongs();
    window.addEventListener('benga:data-stale', handler);
    return () => window.removeEventListener('benga:data-stale', handler);
  }, [fetchSongs]);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-y-3">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent animate-spin" />
        <p className="text-red-600/40 font-mono text-[9px] uppercase tracking-widest animate-pulse">
          A_CARREGAR...
        </p>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-y-4">
        <div className="w-14 h-14 border border-red-900/30 flex items-center justify-center" style={{ clipPath: SLASH_CUT }}>
          <MdMusicOff size={22} className="text-red-900/50" />
        </div>
        <p className="text-red-900/40 font-mono text-[9px] uppercase tracking-[0.3em] text-center">
          SEM_BENGAS<br />AQUI_✖
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-4 gap-y-3">
      <div className="flex items-center gap-x-3 px-1 py-1">
        <HiHeart size={12} className="text-red-500/40 flex-shrink-0" />
        <div className="flex-1 h-px bg-red-900/20" />
        <span className="text-[8px] font-mono text-red-600/20 uppercase tracking-[0.3em]">{songs.length} TRACKS</span>
      </div>
      <div className="flex flex-col gap-y-1">
        {songs.map((song, i) => (
          <div
            key={song.id}
            className="flex items-center gap-x-3 w-full opacity-0 animate-[fadeSlideIn_0.3s_ease_forwards]"
            style={{ animationDelay: `${i * 0.035}s` }}
          >
            <div className="flex-1 min-w-0 pointer-events-none">
              <MediaItem
                onClick={() => onPlay(getSongPlayerId(song))}
                data={song}
              />
            </div>
            <div className="flex-shrink-0">
              <LikedButton songId={song.id} initialLiked={true} />
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px) skewX(-2deg); }
          to   { opacity: 1; transform: translateX(0) skewX(0deg); }
        }
      `}</style>
    </div>
  );
};

export default LikedContent;