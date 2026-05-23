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

  const currentSongRef = useRef<Song | null>(null);
  useEffect(() => { currentSongRef.current = song; }, [song]);

  const songUrl  = useLoadSongUrl((song ?? {}) as Song);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const silentRef   = useRef<HTMLAudioElement | null>(null);

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [volume,     setVolume]     = useState(1);
  const [duration,   setDuration]   = useState(0);
  const [position,   setPosition]   = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const headerDurationRef  = useRef<number | null>(null);
  const volumeRef          = useRef(1);
  const isPlayingRef       = useRef(false);
  const skipOnErrorRef     = useRef(false);
  const endedFiredRef      = useRef(false);
  const shouldBePlayingRef = useRef(false);
  const lastTimeRef        = useRef(0);
  const keepaliveActiveRef = useRef(false);

  useEffect(() => { volumeRef.current    = volume;    }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const startKeepalive = useCallback(() => {
    let silent = silentRef.current;
    if (!silent) {
      silent = new Audio();
      silent.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';
      silent.loop   = true;
      silent.volume = 0.001;
      silent.onplay      = null;
      silent.onpause     = null;
      silent.onended     = null;
      silent.onerror     = null;
      silent.onwaiting   = null;
      silent.oncanplay   = null;
      silentRef.current  = silent;
    }
    keepaliveActiveRef.current = true;
    silent.play().catch(() => {});
  }, []);

  const stopKeepalive = useCallback(() => {
    keepaliveActiveRef.current = false;
    const silent = silentRef.current;
    if (silent) {
      silent.pause();
      silent.currentTime = 0;
    }
  }, []);

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
    fetch('/api/preextract-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds: ytWindow }),
    }).catch(() => {});
  }, [activeID]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.ontimeupdate = () => { setPosition(audio.currentTime); };
    audio.onended      = handleEnded;
    audio.onplay       = () => {
      if (keepaliveActiveRef.current) return;
      setIsPlaying(true);
      setIsLoading(false);
      stopKeepalive();
    };
    audio.onpause      = () => {
      if (!audio.src) return;
      if (keepaliveActiveRef.current) return;
      setIsPlaying(false);
      if (audio.src && audio.currentTime > 0) startKeepalive();
    };
    audio.onwaiting    = () => setIsLoading(true);
    audio.oncanplay    = () => {
      if (keepaliveActiveRef.current) return;
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
      stopKeepalive();
      if (playerRef.current.activeID) playerRef.current.markFailed(playerRef.current.activeID);
    };

    const stuckInterval = setInterval(() => {
      if (keepaliveActiveRef.current) return;
      if (!audio.src || audio.paused) { lastTimeRef.current = audio.currentTime; return; }
      if (isPlayingRef.current) {
        const dbDuration = currentSongRef.current?.duration;
        const dur = headerDurationRef.current || (dbDuration && dbDuration > 0 ? dbDuration : 0) || audio.duration;
        if (dur > 0 && audio.currentTime >= dur - 0.3) {
          if (!endedFiredRef.current) handleEnded();
          return;
        }
        if (
          audio.currentTime === lastTimeRef.current &&
          audio.currentTime > 0 &&
          lastTimeRef.current > 0
        ) {
          audio.play().catch(() => {});
        }
        lastTimeRef.current = audio.currentTime;
      }
    }, 2000);

    const bgStuckInterval = setInterval(async () => {
      if (keepaliveActiveRef.current) return;
      if (shouldBePlayingRef.current && audio.paused && audio.src && audio.readyState >= 3) {
        await unlockAudioContext();
        audio.play().catch(() => {});
      }
    }, 3000);

    const handleVisibilityChange = () => {
      if (keepaliveActiveRef.current) return;
      if (document.visibilityState !== 'visible' || !audio.src) return;
      const dbDuration = currentSongRef.current?.duration;
      const dur = headerDurationRef.current || (dbDuration && dbDuration > 0 ? dbDuration : 0) || audio.duration;
      if (dur > 0 && audio.currentTime >= dur - 0.5 && audio.paused && isPlayingRef.current) {
        handleEnded();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(stuckInterval);
      clearInterval(bgStuckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.pause(); audio.src = '';
      audioRef.current = null;
      stopKeepalive();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    skipOnErrorRef.current  = false;
    headerDurationRef.current = null;
    lastTimeRef.current     = 0;
    setIsLoading(!!songUrl);
    setIsPlaying(false);
    stopKeepalive();

    if (song?.duration && song.duration > 0) {
      setDuration(song.duration);
    } else {
      setDuration(0);
    }

    audio.pause();
    audio.src = '';
    delete audio.dataset.retried;
    audio.onloadedmetadata = null;
    audio.load();

    if (!songUrl) return;

    fetch(songUrl, { method: 'HEAD' })
      .then(res => {
        const cd = res.headers.get('Content-Duration') || res.headers.get('X-Content-Duration');
        if (cd) {
          const parsed = parseFloat(cd);
          if (parsed && !isNaN(parsed) && parsed > 0) {
            headerDurationRef.current = parsed;
            setDuration(parsed);
          }
        }
      })
      .catch(() => {});

    let metaStableTimer: ReturnType<typeof setTimeout>;

    const onMeta = () => {
      if (headerDurationRef.current || (currentSongRef.current?.duration && currentSongRef.current.duration > 0)) {
        setDuration(headerDurationRef.current || currentSongRef.current!.duration);
        return;
      }
      const reported = audio.duration;
      if (!reported || !isFinite(reported) || reported <= 0) return;
      clearTimeout(metaStableTimer);
      metaStableTimer = setTimeout(() => {
        const settled = audio.duration;
        if (settled && isFinite(settled) && settled > 0) setDuration(settled);
        audio.removeEventListener('loadedmetadata', onMeta);
        audio.removeEventListener('durationchange', onDurationChange);
      }, 1500);
    };

    const onDurationChange = () => {
      if (headerDurationRef.current || (currentSongRef.current?.duration && currentSongRef.current.duration > 0)) {
        setDuration(headerDurationRef.current || currentSongRef.current!.duration);
        return;
      }
      const d = audio.duration;
      if (!d || !isFinite(d) || d <= 0) return;
      clearTimeout(metaStableTimer);
      metaStableTimer = setTimeout(() => {
        const settled = audio.duration;
        if (settled && isFinite(settled) && settled > 0) setDuration(settled);
      }, 500);
    };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onDurationChange);

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
      audio.removeEventListener('durationchange', onDurationChange);
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
    if (isPlaying) {
      shouldBePlayingRef.current = false;
      audio.pause();
    } else {
      stopKeepalive();
      shouldBePlayingRef.current = true;
      safePlay(audio).catch(() => {});
    }
    setTimeout(broadcastCurrentState, 50);
  };

  const handleNext = () => {
    if (session && !session.canControl) return;
    stopKeepalive();
    playerRef.current.playNext();
    setTimeout(broadcastCurrentState, 200);
  };

  const handlePrevious = () => {
    if (session && !session.canControl) return;
    stopKeepalive();
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

  const toggleMute = () => setVolume(prev => prev === 0 ? 99 : 99);

  useMediaSession(
    isPlaying, (song ?? {}) as Song, audioRef,
    keepaliveActiveRef,
    () => {
      startKeepalive();
      shouldBePlayingRef.current = true;
      safePlay(audioRef.current!).catch(() => {});
      setTimeout(broadcastCurrentState, 50);
    },
    () => {
      shouldBePlayingRef.current = false;
      audioRef.current?.pause();
      setTimeout(broadcastCurrentState, 50);
    }
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