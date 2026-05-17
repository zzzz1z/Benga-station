'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import usePlayer, { loadFromSession } from "@/hooks/usePlayer";
import useMediaSession from "@/hooks/useMediaSession";
import PlayerContent from "./PlayerContent";
import ExpandedPlayer from "./ExpandedPlayer";
import { Song } from "@/types";
import { useSessionContext } from "@/providers/SessionContext";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

let audioCtx: AudioContext | null = null;

async function unlockAudioContext(): Promise<void> {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
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

const recordPlayEvent = (videoId: string) => {
  fetch('/api/play-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  }).catch(() => {});
};

const resolveSongUrl = async (song: Song): Promise<string> => {
  if (!song?.id) return '';
  if (song.source === 'youtube' && song.youtube_video_id) {
    return `/api/youtube/stream?videoId=${song.youtube_video_id}`;
  }
  if (song.song_path) {
    const { data } = supabase.storage.from('musicas').getPublicUrl(song.song_path);
    return data?.publicUrl ?? '';
  }
  return '';
};

const PRELOAD_AT = 50;
const CROSSFADE_AT = 10;
const CROSSFADE_DURATION = 10;

const Player = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = loadFromSession();
    if (saved && saved.activeID && saved.ids.length > 0) {
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

  const player = usePlayer();
  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; }, [player]);

  const activeID  = usePlayer(state => state.activeID);
  const playCount = usePlayer(state => state.playCount);
  const songsMap  = usePlayer(state => state.songs);

  const lastGoodSongRef = useRef<Song | null>(null);
  const songFromStore   = activeID ? songsMap[activeID] : null;
  if (songFromStore && activeID) lastGoodSongRef.current = songFromStore;
  const song = songFromStore ?? lastGoodSongRef.current;

  const songUrl  = useLoadSongUrl((song ?? {}) as Song);
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [volume,     setVolume]     = useState(1);
  const [duration,   setDuration]   = useState(0);
  const [position,   setPosition]   = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const volumeRef           = useRef(1);
  const isPlayingRef        = useRef(false);
  const skipOnErrorRef      = useRef(false);
  const endedFiredRef       = useRef(false);
  const shouldBePlayingRef  = useRef(false);

  // Crossfade refs
  const crossfadeActiveRef    = useRef(false);
  const crossfadeCompleteRef  = useRef(false);
  const crossfadeFrameRef     = useRef<number | null>(null);
  const nextSongPreloadedRef  = useRef<string>('');
  const nextSongIdRef         = useRef<string>('');
  const preloadTriggeredRef   = useRef(false);
  const crossfadeTriggeredRef = useRef(false);

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

  const prevQueueRef = useRef<string>('');
  useEffect(() => {
    const { ids, songs: songMap, activeID: aid } = usePlayer.getState();
    const key = ids.join(',') + (aid ?? '');
    if (key === prevQueueRef.current) return;
    prevQueueRef.current = key;
    if (sessionRef.current?.isHost) {
      broadcastQueue(ids, songMap, aid ?? '');
    }
  });

  const getNextSong = useCallback((): Song | null => {
    const { ids, activeID: aid, songs: songMap, repeatMode, shuffleOn } = usePlayer.getState();
    if (!aid || !ids.length) return null;
    if (repeatMode === 'one') return songMap[aid] ?? null;
    const currentIndex = ids.indexOf(aid);
    if (shuffleOn) {
      const others = ids.filter(id => id !== aid);
      if (!others.length) return null;
      const randomId = others[Math.floor(Math.random() * others.length)];
      return songMap[randomId] ?? null;
    }
    if (repeatMode === 'all') {
      const nextIndex = currentIndex === ids.length - 1 ? 0 : currentIndex + 1;
      return songMap[ids[nextIndex]] ?? null;
    }
    if (currentIndex === -1 || currentIndex === ids.length - 1) return null;
    return songMap[ids[currentIndex + 1]] ?? null;
  }, []);

  const cancelCrossfade = useCallback(() => {
    if (crossfadeFrameRef.current !== null) {
      cancelAnimationFrame(crossfadeFrameRef.current);
      crossfadeFrameRef.current = null;
    }
    crossfadeActiveRef.current = false;
    crossfadeCompleteRef.current = false;
    const next = nextAudioRef.current;
    if (next) {
      next.pause();
      next.src = '';
      next.load();
    }
    nextSongPreloadedRef.current = '';
    nextSongIdRef.current = '';
    preloadTriggeredRef.current = false;
    crossfadeTriggeredRef.current = false;
  }, []);

  const preloadNextSong = useCallback(async () => {
    const nextSong = getNextSong();
    if (!nextSong) return;
    const nextId = nextSong.source === 'youtube' && nextSong.youtube_video_id
      ? `yt_${nextSong.youtube_video_id}`
      : String(nextSong.id);

    if (nextSongIdRef.current === nextId) return;

    const url = await resolveSongUrl(nextSong);
    if (!url) return;

    const next = nextAudioRef.current;
    if (!next) return;

    next.src = url;
    next.volume = 0;
    next.load();
    nextSongPreloadedRef.current = url;
    nextSongIdRef.current = nextId;
  }, [getNextSong]);

  const startCrossfade = useCallback(() => {
    if (crossfadeActiveRef.current) return;
    const next = nextAudioRef.current;
    const current = audioRef.current;
    if (!next || !current || !nextSongPreloadedRef.current) return;

    crossfadeActiveRef.current = true;
    const startTime = performance.now();
    const startVolume = volumeRef.current;

    safePlay(next).catch(() => {});

    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / CROSSFADE_DURATION, 1);

      if (current.src) current.volume = startVolume * (1 - progress);
      next.volume = startVolume * progress;

      if (progress < 1) {
        crossfadeFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Crossfade done — mark complete BEFORE playNext so songUrl effect sees it
        crossfadeCompleteRef.current = true;
        crossfadeActiveRef.current = false;
        crossfadeFrameRef.current = null;

        // Advance player state
        endedFiredRef.current = true;
        playerRef.current.playNext();
        setTimeout(() => { endedFiredRef.current = false; }, 1000);
      }
    };

    crossfadeFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const handleEnded = useCallback(() => {
    if (endedFiredRef.current) return;
    if (crossfadeActiveRef.current) return;
    endedFiredRef.current = true;
    playerRef.current.playNext();
    setTimeout(() => { endedFiredRef.current = false; }, 1000);
  }, []);

  useEffect(() => {
    if (!activeID) return;
    const s = songsMap[activeID];
    if (s?.source === 'youtube' && s?.youtube_video_id) {
      recordPlayEvent(s.youtube_video_id);
    }

    const { ids } = usePlayer.getState();
    const currentIdx = ids.indexOf(activeID);
    if (currentIdx === -1) return;

    const window = [
      ...ids.slice(Math.max(0, currentIdx - 3), currentIdx),
      ...ids.slice(currentIdx + 1, currentIdx + 6),
    ]
      .filter(id => id.startsWith('yt_'))
      .map(id => id.slice(3));

    if (!window.length) return;
    window.forEach(videoId => {
      fetch('/api/preextract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      }).catch(() => {});
    });
  }, [activeID]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = new Audio();
    const nextAudio = new Audio();
    audioRef.current = audio;
    nextAudioRef.current = nextAudio;

    let lastTime = 0;
    let stuckInterval: NodeJS.Timeout;

    audio.ontimeupdate = () => {
      const current = audio.currentTime;
      const dur = audio.duration;
      setPosition(current);

      if (!dur || !isFinite(dur) || !isPlayingRef.current) return;
      const remaining = dur - current;

      if (remaining <= PRELOAD_AT && !preloadTriggeredRef.current) {
        preloadTriggeredRef.current = true;
        preloadNextSong();
      }

      if (remaining <= CROSSFADE_AT && !crossfadeTriggeredRef.current && nextSongPreloadedRef.current) {
        crossfadeTriggeredRef.current = true;
        startCrossfade();
      }
    };

    audio.onended      = handleEnded;
    audio.onplay       = () => { setIsPlaying(true);  setIsLoading(false); };
    audio.onpause      = () => { if (audio.src) setIsPlaying(false); };
    audio.onwaiting    = () => setIsLoading(true);
    audio.oncanplay    = () => {
      setIsLoading(false);
      if (shouldBePlayingRef.current && audio.paused) {
        safePlay(audio).catch(() => {});
      }
    };

    audio.onerror = () => {
      if (!audio.src || !skipOnErrorRef.current) return;
      if (!audio.dataset.retried) {
        audio.dataset.retried = '1';
        const src = audio.src;
        audio.src = '';
        audio.load();
        setTimeout(() => {
          audio.src = src;
          audio.load();
          safePlay(audio).catch(() => {});
        }, 800);
        return;
      }
      setIsLoading(false);
      setIsPlaying(false);
      if (playerRef.current.activeID) playerRef.current.markFailed(playerRef.current.activeID);
    };

    stuckInterval = setInterval(() => {
      if (!audio.src || audio.paused) { lastTime = audio.currentTime; return; }
      if (isPlayingRef.current) {
        const dur = audio.duration;
        if (dur > 0 && audio.currentTime >= dur - 0.3) {
          if (!endedFiredRef.current) handleEnded();
          return;
        }
        if (audio.currentTime === lastTime && audio.currentTime > 0) {
          audio.play().catch(() => {});
        }
        lastTime = audio.currentTime;
      }
    }, 2000);

    const backgroundStuckInterval = setInterval(async () => {
      if (
        shouldBePlayingRef.current &&
        audio.paused &&
        audio.src &&
        audio.readyState >= 3
      ) {
        await unlockAudioContext();
        audio.play().catch(() => {});
      }
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !audio.src) return;
      if (audio.duration > 0 && audio.currentTime >= audio.duration - 0.5 &&
        audio.paused && isPlayingRef.current) {
        handleEnded();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(stuckInterval);
      clearInterval(backgroundStuckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.pause();
      audio.src = '';
      nextAudio.pause();
      nextAudio.src = '';
      audioRef.current = null;
      nextAudioRef.current = null;
    };
  }, [handleEnded, preloadNextSong, startCrossfade]);

  // Song URL change → load new song (or swap refs if crossfade already handled it)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Crossfade already played the next song — just swap refs, don't reload
    if (crossfadeCompleteRef.current && nextAudioRef.current?.src) {
      crossfadeCompleteRef.current = false;

      const next = nextAudioRef.current;
      const current = audioRef.current;

      // Swap refs
      audioRef.current = next;
      nextAudioRef.current = current;

      // Clean up old current
      if (current) {
        current.pause();
        current.src = '';
        current.load();
      }

      // Sync state from next (now current)
      next.volume = volumeRef.current;
      setIsPlaying(!next.paused);
      setPosition(next.currentTime);
      if (next.duration && isFinite(next.duration)) setDuration(next.duration);

      // Reset crossfade tracking for next song
      nextSongPreloadedRef.current = '';
      nextSongIdRef.current = '';
      preloadTriggeredRef.current = false;
      crossfadeTriggeredRef.current = false;

      // Re-attach event listeners to new audioRef
      next.ontimeupdate = () => {
        const cur = next.currentTime;
        const dur = next.duration;
        setPosition(cur);
        if (!dur || !isFinite(dur) || !isPlayingRef.current) return;
        const remaining = dur - cur;
        if (remaining <= PRELOAD_AT && !preloadTriggeredRef.current) {
          preloadTriggeredRef.current = true;
          preloadNextSong();
        }
        if (remaining <= CROSSFADE_AT && !crossfadeTriggeredRef.current && nextSongPreloadedRef.current) {
          crossfadeTriggeredRef.current = true;
          startCrossfade();
        }
      };
      next.onended = handleEnded;
      next.onplay  = () => { setIsPlaying(true);  setIsLoading(false); };
      next.onpause = () => { if (next.src) setIsPlaying(false); };

      registerPlayer({ audioRef, setIsPlaying, setPosition });
      return;
    }

    // Normal song load
    cancelCrossfade();

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
      audio.src = songUrl;
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
  }, [songUrl, cancelCrossfade, preloadNextSong, startCrossfade, handleEnded, registerPlayer, broadcastCurrentState]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.src && playCount > 0) {
      audio.currentTime = 0;
      safePlay(audio);
    }
  }, [playCount]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (nextAudioRef.current && !crossfadeActiveRef.current) {
      nextAudioRef.current.volume = 0;
    }
  }, [volume]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;
    if (session && !session.canControl) return;

    if (isPlaying) {
      audio.pause();
      shouldBePlayingRef.current = false;
    } else {
      safePlay(audio).catch(() => {});
      shouldBePlayingRef.current = true;
    }
    setTimeout(broadcastCurrentState, 50);
  };

  const handleNext = () => {
    if (session && !session.canControl) return;
    cancelCrossfade();
    playerRef.current.playNext();
    setTimeout(broadcastCurrentState, 200);
  };

  const handlePrevious = () => {
    if (session && !session.canControl) return;
    cancelCrossfade();
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setPosition(0);
    } else {
      playerRef.current.playPrevious();
    }
    setTimeout(broadcastCurrentState, 200);
  };

  const handleSeek = (value: number) => {
    if (session && !session.canControl) return;
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setPosition(value);
      preloadTriggeredRef.current = false;
      crossfadeTriggeredRef.current = false;
      if (crossfadeActiveRef.current) cancelCrossfade();
      broadcastCurrentState();
    }
  };

  const toggleMute = () => setVolume(prev => prev === 0 ? 1 : 0);

  useMediaSession(
    isPlaying,
    (song ?? {}) as Song,
    audioRef,
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
  };

  return (
    <>
      {isExpanded && (
        <ExpandedPlayer
          {...sharedProps}
          onClose={() => setIsExpanded(false)}
        />
      )}
      <div className="fixed bottom-0 bg-neutral-950/95 backdrop-blur-md w-full h-[100px] pb-[30px] border-t border-red-900/40 px-4 z-[40]">
        <PlayerContent
          {...sharedProps}
          onExpand={() => setIsExpanded(true)}
          session={session}
        />
      </div>
    </>
  );
};

export default Player;