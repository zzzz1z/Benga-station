'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import usePlayer, { loadFromSession } from "@/hooks/usePlayer";
import useMediaSession from "@/hooks/useMediaSession";
import PlayerContent from "./PlayerContent";
import ExpandedPlayer from "./ExpandedPlayer";
import { Song } from "@/types";
import { useSessionContext } from "@/providers/SessionContext";
import { useQueueExtender } from '@/hooks/useQueueExtender';

let audioCtx: AudioContext | null = null;

async function unlockAudioContext(): Promise<void> {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
  } catch {}
}

export async function safePlay(audio: HTMLAudioElement): Promise<void> {
  await unlockAudioContext();
  try {
    await audio.play();
  } catch (err: any) {
    if (err?.name === "NotAllowedError" || err?.name === "NotSupportedError") {
      await new Promise(r => setTimeout(r, 300));
      await unlockAudioContext();
      await audio.play().catch(() => {});
    }
  }
}

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
  const song = songFromStore ?? lastGoodSongRef.current;

  const songUrl  = useLoadSongUrl((song ?? {}) as Song);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [volume,     setVolume]     = useState(1);
  const [duration,   setDuration]   = useState(0);
  const [position,   setPosition]   = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const volumeRef          = useRef(1);
  const isPlayingRef       = useRef(false);
  const skipOnErrorRef     = useRef(false);
  const endedFiredRef      = useRef(false);
  const shouldBePlayingRef = useRef(false);

  useEffect(() => { volumeRef.current    = volume;    }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const { session, broadcastState, broadcastQueue, registerPlayer } = useSessionContext();
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    registerPlayer({ audioRef, setIsPlaying, setPosition });
  }, [registerPlayer]);

  const broadcastCurrentState = useCallback(() => {
    if (!sessionRef.current?.canControl) return;
    const audio = audioRef.current;
    broadcastState({
      activeID: usePlayer.getState().activeID ?? null,
      isPlaying: !!(audio && !audio.paused),
      position: audio?.currentTime ?? 0,
      timestamp: Date.now(),
    });
  }, [broadcastState]);

  const prevQueueRef = useRef('');
  useEffect(() => {
    const { ids, songs: songMap, activeID: aid } = usePlayer.getState();
    const key = ids.join(',') + (aid ?? '');
    if (key === prevQueueRef.current) return;
    prevQueueRef.current = key;
    if (sessionRef.current?.isHost) broadcastQueue(ids, songMap, aid ?? '');
  });

  const handleEnded = () => {
    if (endedFiredRef.current) return;
    endedFiredRef.current = true;
    playerRef.current.playNext();
    setTimeout(() => { endedFiredRef.current = false; }, 1000);
  };

  // Preextract nearby songs in queue when active track changes
  useEffect(() => {
    if (!activeID) return;

    const { ids } = usePlayer.getState();
    const idx = ids.indexOf(activeID);
    if (idx === -1) return;

    const ytWindow = [
      ...ids.slice(Math.max(0, idx - 3), idx),
      ...ids.slice(idx + 1, idx + 6),
    ].filter(id => id.startsWith('yt_')).map(id => id.slice(3));

    if (!ytWindow.length) return;
    ytWindow.forEach(videoId => {
      fetch('/api/preextract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      }).catch(() => {});
    });
  }, [activeID]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    let lastTime = 0;

    audio.ontimeupdate = () => { setPosition(audio.currentTime); };
    audio.onended      = handleEnded;
    audio.onplay       = () => { setIsPlaying(true);  setIsLoading(false); };
    audio.onpause      = () => { if (audio.src) setIsPlaying(false); };
    audio.onwaiting    = () => setIsLoading(true);
    audio.oncanplay    = () => {
      setIsLoading(false);
      if (shouldBePlayingRef.current && audio.paused) safePlay(audio).catch(() => {});
    };
    audio.onerror = () => {
      if (!audio.src || !skipOnErrorRef.current) return;
      if (!audio.dataset.retried) {
        audio.dataset.retried = '1';
        const src = audio.src;
        audio.src = ''; audio.load();
        setTimeout(() => { audio.src = src; audio.load(); safePlay(audio).catch(() => {}); }, 800);
        return;
      }
      setIsLoading(false); setIsPlaying(false);
      if (playerRef.current.activeID) playerRef.current.markFailed(playerRef.current.activeID);
    };

    const stuckInterval = setInterval(() => {
      if (!audio.src || audio.paused) { lastTime = audio.currentTime; return; }
      if (isPlayingRef.current) {
        const dur = audio.duration;
        if (dur > 0 && audio.currentTime >= dur - 0.3) {
          if (!endedFiredRef.current) handleEnded();
          return;
        }
        if (audio.currentTime === lastTime && audio.currentTime > 0) audio.play().catch(() => {});
        lastTime = audio.currentTime;
      }
    }, 2000);

    const bgStuckInterval = setInterval(async () => {
      if (shouldBePlayingRef.current && audio.paused && audio.src && audio.readyState >= 3) {
        await unlockAudioContext();
        audio.play().catch(() => {});
      }
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !audio.src) return;
      if (audio.duration > 0 && audio.currentTime >= audio.duration - 0.5 &&
        audio.paused && isPlayingRef.current) handleEnded();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(stuckInterval);
      clearInterval(bgStuckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.pause(); audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    skipOnErrorRef.current = false;
    setIsLoading(!!songUrl);
    setIsPlaying(false);
    setDuration(0);

    audio.pause();
    audio.src = '';
    delete audio.dataset.retried;
    audio.onloadedmetadata = null;
    audio.load();

    if (!songUrl) return;

    let metaDuration = 0;
    let metaStableTimer: ReturnType<typeof setTimeout>;

    const onMeta = () => {
      const reported = audio.duration;
      if (!reported || !isFinite(reported)) return;
      if (metaDuration === 0) {
        metaDuration = reported;
        metaStableTimer = setTimeout(() => {
          setDuration(audio.duration);
          audio.removeEventListener('loadedmetadata', onMeta);
        }, 800);
        return;
      }
      clearTimeout(metaStableTimer);
      setDuration(reported);
      audio.removeEventListener('loadedmetadata', onMeta);
    };
    audio.addEventListener('loadedmetadata', onMeta);

    const timer = setTimeout(() => {
      skipOnErrorRef.current = true;
      audio.src    = songUrl;
      audio.volume = volumeRef.current;
      audio.load();
      safePlay(audio).then(() => {
        setIsPlaying(true);
        setPosition(0);
        shouldBePlayingRef.current = true;
        broadcastCurrentState();
      }).catch(() => {
        setIsLoading(false);
        shouldBePlayingRef.current = true;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(metaStableTimer!);
      audio.removeEventListener('loadedmetadata', onMeta);
    };
  }, [songUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.src && playCount > 0) { audio.currentTime = 0; safePlay(audio); }
  }, [playCount]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;
    if (session && !session.canControl) return;
    if (isPlaying) { audio.pause(); shouldBePlayingRef.current = false; }
    else { safePlay(audio).catch(() => {}); shouldBePlayingRef.current = true; }
    setTimeout(broadcastCurrentState, 50);
  };

  const handleNext = () => {
    if (session && !session.canControl) return;
    playerRef.current.playNext();
    setTimeout(broadcastCurrentState, 200);
  };

  const handlePrevious = () => {
    if (session && !session.canControl) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; setPosition(0); }
    else playerRef.current.playPrevious();
    setTimeout(broadcastCurrentState, 200);
  };

  const handleSeek = (value: number) => {
    if (session && !session.canControl) return;
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setPosition(value);
      broadcastCurrentState();
    }
  };

  const toggleMute = () => setVolume(prev => prev === 0 ? 1 : 0);

  useMediaSession(
    isPlaying, (song ?? {}) as Song, audioRef,
    () => { safePlay(audioRef.current!).catch(() => {}); shouldBePlayingRef.current = true; setTimeout(broadcastCurrentState, 50); },
    () => { audioRef.current?.pause(); shouldBePlayingRef.current = false; setTimeout(broadcastCurrentState, 50); }
  );

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