'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import usePlayer, { DEFAULT_CONTEXT, loadFromSession } from "@/hooks/usePlayer";
import ExpandedPlayer from "./ExpandedPlayer";
import { Song } from "@/types";
import { useSessionContext } from "@/providers/SessionContext";
import { useQueueExtender } from '@/hooks/useQueueExtender';
import { preextractWindow } from "@/utils/player";
import { backend as NativeAudio } from '@/utils/audioBackend';
import PlayerContent from "./PlayerContent";

const ASSET_ID = 'benga_track';

const getArtworkUrl = (song: Song): string => {
  if (!song?.image_path) return '';
  if (song.source === 'youtube' || song.image_path.startsWith('http')) {
    return song.image_path;
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imagens/${song.image_path}`;
};

const Player = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { status: queueStatus, fetchMore: queueFetchMore } = useQueueExtender({ enabled: true });



  useEffect(() => {
    const saved = loadFromSession();
    if (saved?.activeID && saved.ids.length > 0) {
      usePlayer.setState({
        ids: saved.ids,
        originalIds: saved.originalIds ?? saved.ids,
        songs: saved.songs,
        activeID: saved.activeID,
        shuffleOn: saved.shuffleOn,
        repeatMode: saved.repeatMode,
        queueContext: saved.queueContext ?? DEFAULT_CONTEXT,
        history: saved.history ?? [],
      });
    }
    setIsMounted(true);
  }, []);

  const player    = usePlayer();
  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; }, [player]);

  const activeID  = usePlayer(s => s.activeID);
  const playCount = usePlayer(s => s.playCount);
  const songsMap  = usePlayer(s => s.songs);

  const lastGoodSongRef = useRef<Song | null>(null);
  const songFromStore   = activeID ? songsMap[activeID] : null;
  if (songFromStore && activeID) lastGoodSongRef.current = songFromStore;
  const song        = songFromStore ?? lastGoodSongRef.current;
  const songForLoad = songFromStore;

  const currentSongRef = useRef<Song | null>(null);
  useEffect(() => { currentSongRef.current = song ?? null; }, [song]);
  const manualLoadRef = useRef(false);
  const songUrl = useLoadSongUrl((songForLoad ?? { id: '' }) as Song);

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [volume,     setVolume]     = useState(1);
  const [duration,   setDuration]   = useState(0);
  const [position,   setPosition]   = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoadingRef  = useRef(false);
  const isLoadedRef   = useRef(false);
  const endedFiredRef = useRef(false);
  const volumeRef     = useRef(1);
  const isPlayingRef  = useRef(false);

  useEffect(() => { volumeRef.current    = volume;    }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const { session, broadcastState, broadcastQueue, registerPlayer } = useSessionContext();
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    registerPlayer({ audioRef, setIsPlaying, setPosition });
  }, [registerPlayer]);

  const broadcastCurrentState = useCallback(async () => {
    if (!sessionRef.current?.canControl) return;
    let pos = position;
    try { const r = await NativeAudio.getCurrentTime({ assetId: ASSET_ID }); pos = r.currentTime; } catch {}
    broadcastState({
      activeID: usePlayer.getState().activeID ?? null,
      isPlaying: isPlayingRef.current,
      position: pos,
      timestamp: Date.now(),
    });
  }, [broadcastState, position]);

  const prevQueueRef = useRef('');
  useEffect(() => {
    const { ids, songs: songMap, activeID: aid } = usePlayer.getState();
    const key = ids.join(',') + (aid ?? '');
    if (key === prevQueueRef.current) return;
    prevQueueRef.current = key;
    if (sessionRef.current?.isHost) broadcastQueue(ids, songMap, aid ?? '');
  });

  useEffect(() => {
    if (!activeID) return;
    const { ids } = usePlayer.getState();
    preextractWindow(activeID, ids);
  }, [activeID]);

  useEffect(() => {
    NativeAudio.configure({
      showNotification: true,
      background: true,
    } as any).catch(() => {});
  }, []);

  useEffect(() => {
const completeSub = NativeAudio.addListener('complete', (data: any) => {
  if (data.assetId !== ASSET_ID) return;
  if (manualLoadRef.current) return;   // ← ADD THIS
  if (endedFiredRef.current) return;
  endedFiredRef.current = true;
  playerRef.current.playNext();
  setTimeout(() => { endedFiredRef.current = false; }, 1000);
});

    const timeSub = NativeAudio.addListener('currentTime', (data: any) => {
      if (data.assetId !== ASSET_ID) return;
      if (data.currentTime !== undefined) setPosition(data.currentTime);
      if (data.duration && data.duration > 0) setDuration(data.duration);
    });

    const stateSub = NativeAudio.addListener('playbackState', (data: any) => {
      if (data.assetId !== ASSET_ID) return;
      const state: string = data.state ?? '';

      if (state === 'playing') {
        setIsPlaying(true);
        setIsLoading(false);
      } else if (state === 'paused') {
        setIsPlaying(false);
      } else if (state === 'nextTrack') {
        playerRef.current.playNext();
      } else if (state === 'previousTrack') {
        const cur = playerRef.current;
        const curTime = data.position ?? 0;
        if (curTime > 3) {
          NativeAudio.setCurrentTime({ assetId: ASSET_ID, time: 0 }).catch(() => {});
          setPosition(0);
        } else {
          cur.playPrevious();
        }
} else if (state === 'completed') {
  if (manualLoadRef.current) return;   // ← ADD THIS
  if (endedFiredRef.current) return;
  endedFiredRef.current = true;
  playerRef.current.playNext();
  setTimeout(() => { endedFiredRef.current = false; }, 1000);
}
    });

    return () => {
      completeSub.then(h => h.remove()).catch(() => {});
      timeSub.then(h => h.remove()).catch(() => {});
      stateSub.then(h => h.remove()).catch(() => {});
      NativeAudio.stop({ assetId: ASSET_ID }).catch(() => {});
      NativeAudio.unload({ assetId: ASSET_ID }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!songUrl || !songForLoad) return;
    let cancelled = false;

const load = async () => {
  manualLoadRef.current = true;        // ← ADD: block complete events
  isLoadedRef.current = false;
      setIsLoading(true);
      setIsPlaying(false);
      setPosition(0);
      endedFiredRef.current = false;

      try { await NativeAudio.stop({ assetId: ASSET_ID }); } catch {}
      try { await NativeAudio.unload({ assetId: ASSET_ID }); } catch {}


      const artworkUrl = getArtworkUrl(songForLoad);

      try {
        await NativeAudio.preload({
          assetId: ASSET_ID,
          assetPath: songUrl,
          isUrl: true,
          notificationMetadata: {
            title: songForLoad.title,
            artist: songForLoad.author,
            album: 'Benga Station',
            artworkUrl,
          },
        } as any);
   
      } catch (e) {
    
        if (cancelled) return;
        setIsLoading(false);
        isLoadingRef.current = false;
        if (activeID) playerRef.current.markFailed(activeID);
        playerRef.current.playNext();
        return;
      }

      manualLoadRef.current = false;       // ← ADD: re-enable after preload (safe point)



      isLoadedRef.current = true;
      isLoadingRef.current = false;

      try {
        const d = await NativeAudio.getDuration({ assetId: ASSET_ID });
        if (d.duration > 0) setDuration(d.duration);
        else if (songForLoad.duration && songForLoad.duration > 0) setDuration(songForLoad.duration);
      } catch {
        if (songForLoad.duration && songForLoad.duration > 0) setDuration(songForLoad.duration);
      }

      if (cancelled) return;

      await NativeAudio.setVolume({ assetId: ASSET_ID, volume: volumeRef.current });

      try {
        await NativeAudio.play({ assetId: ASSET_ID });
     
        if (!cancelled) {
          setIsPlaying(true);
          setIsLoading(false);
          setTimeout(broadcastCurrentState, 100);
        }
      } catch {
      
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => { cancelled = true;
        manualLoadRef.current = false;       // ← ADD: reset on cleanup

     };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl]);

  useEffect(() => {
    if (playCount === 0 || !isLoadedRef.current) return;
    NativeAudio.setCurrentTime({ assetId: ASSET_ID, time: 0 }).catch(() => {});
    NativeAudio.play({ assetId: ASSET_ID }).catch(() => {});
    setPosition(0);
  }, [playCount]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    NativeAudio.setVolume({ assetId: ASSET_ID, volume: volume }).catch(() => {});
  }, [volume]);

  const handlePlay = useCallback(async () => {
    if (isLoadingRef.current) return;
    if (session && !session.canControl) return;
    if (isPlayingRef.current) {
      await NativeAudio.pause({ assetId: ASSET_ID }).catch(() => {});
      setIsPlaying(false);
    } else {
      await NativeAudio.resume({ assetId: ASSET_ID }).catch(() => {});
      setIsPlaying(true);
    }
    setTimeout(broadcastCurrentState, 50);
  }, [session, broadcastCurrentState]);

  const handleNext = useCallback(() => {
    if (session && !session.canControl) return;
    playerRef.current.playNext();
    setTimeout(broadcastCurrentState, 200);
  }, [session, broadcastCurrentState]);

  const handlePrevious = useCallback(async () => {
    if (session && !session.canControl) return;
    let curTime = position;
    try { const r = await NativeAudio.getCurrentTime({ assetId: ASSET_ID }); curTime = r.currentTime; } catch {}
    if (curTime > 3) {
      await NativeAudio.setCurrentTime({ assetId: ASSET_ID, time: 0 }).catch(() => {});
      setPosition(0);
    } else {
      playerRef.current.playPrevious();
    }
    setTimeout(broadcastCurrentState, 200);
  }, [session, broadcastCurrentState, position]);

  const handleSeek = useCallback(async (value: number) => {
    if (session && !session.canControl) return;
    await NativeAudio.setCurrentTime({ assetId: ASSET_ID, time: value }).catch(() => {});
    setPosition(value);
    broadcastCurrentState();
  }, [session, broadcastCurrentState]);

  const toggleMute = useCallback(() => {
    setVolume(prev => prev === 0 ? 1 : 0);
  }, []);

  if (!isMounted) return null;
  if (!activeID && !lastGoodSongRef.current) return null;
  if (!song) return null;

  const sharedProps = {
    song, isPlaying, isLoading, position, duration, volume,
    onPlay: handlePlay, onNext: handleNext, onPrevious: handlePrevious,
    onSeek: handleSeek, onVolumeChange: setVolume, onToggleMute: toggleMute,
    queueStatus, queueFetchMore,
  };

  return (
    <>
   

      {isExpanded && (
        <ExpandedPlayer {...sharedProps} onClose={() => setIsExpanded(false)} />
      )}
      <div className="fixed bottom-0 bg-neutral-950/95 backdrop-blur-md w-full h-[120px] md:h-[100px] pb-[30px] border-t border-red-900/40 px-4 z-[40]">
        <PlayerContent {...sharedProps} onExpand={() => setIsExpanded(true)} session={session} />
      </div>
    </>
  );
};

export default Player;