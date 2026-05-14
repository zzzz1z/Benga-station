'use client';

import { useEffect, useRef, useState } from "react";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import usePlayer from "@/hooks/usePlayer";
import useMediaSession from "@/hooks/useMediaSession";
import PlayerContent from "./PlayerContent";
import ExpandedPlayer from "./ExpandedPlayer";
import { Song } from "@/types";

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

const preWarmAround = (activePlayerId: string) => {
  const { ids } = usePlayer.getState();

  const activeIdStr = String(activePlayerId);
  const currentIndex = ids.findIndex(id => String(id) === activeIdStr);
  if (currentIndex === -1) return;

  const neighbours = [
    ids[currentIndex + 1],
    ids[currentIndex + 2],
    ids[currentIndex - 1],
  ].filter(Boolean) as string[];

  const videoIds = neighbours
    .filter(id => id.startsWith('yt_'))
    .map(id => id.replace('yt_', ''));

  if (videoIds.length === 0) return;

  fetch('/api/warm-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds }),
  }).catch(() => {});
};

const isNative = () =>
  typeof (window as any).Capacitor !== 'undefined' &&
  (window as any).Capacitor.isNativePlatform();

const Player = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const player = usePlayer();
  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; }, [player]);

  const activeID = usePlayer(state => state.activeID);
  const playCount = usePlayer(state => state.playCount);
  const songsMap = usePlayer(state => state.songs);

  const lastGoodSongRef = useRef<Song | null>(null);
  const songFromStore = activeID ? songsMap[activeID] : null;
  if (songFromStore && activeID) lastGoodSongRef.current = songFromStore;
  const song = songFromStore ?? lastGoodSongRef.current;

  const songUrl = useLoadSongUrl((song ?? {}) as Song);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const volumeRef = useRef(1);
  const isPlayingRef = useRef(false);
  const skipOnErrorRef = useRef(false);
  const endedFiredRef = useRef(false);

  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const handleEnded = () => {
    if (endedFiredRef.current) return;
    endedFiredRef.current = true;
    playerRef.current.playNext();
    setTimeout(() => { endedFiredRef.current = false; }, 1000);
  };

  useEffect(() => {
    if (!activeID) return;
    preWarmAround(String(activeID));
    const s = songsMap[activeID];
    if (s?.source === 'youtube' && s?.youtube_video_id) {
      recordPlayEvent(s.youtube_video_id);
    }
  }, [activeID]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = new Audio();
    if (!isNative()) audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    let lastTime = 0;
    let stuckInterval: NodeJS.Timeout;

    audio.ontimeupdate = () => { setPosition(audio.currentTime); };
    audio.onended = handleEnded;
    audio.onplay = () => { setIsPlaying(true); setIsLoading(false); };
    audio.onpause = () => { if (audio.src) setIsPlaying(false); };
    audio.onwaiting = () => setIsLoading(true);
    audio.oncanplay = () => setIsLoading(false);

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
        // Catch silence-after-end: currentTime at or past duration
        if (dur > 0 && audio.currentTime >= dur - 0.3) {
          if (!endedFiredRef.current) handleEnded();
          return;
        }
        // Catch genuinely stuck stream
        if (audio.currentTime === lastTime && audio.currentTime > 0) {
          audio.play().catch(() => {});
        }
        lastTime = audio.currentTime;
      }
    }, 2000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !audio.src) return;
      if (audio.duration > 0 && audio.currentTime >= audio.duration - 0.5 && audio.paused && isPlayingRef.current) {
        handleEnded();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(stuckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    skipOnErrorRef.current = false;
    setIsLoading(!!songUrl);
    setIsPlaying(false);
    setDuration(0); // reset duration immediately on song change

    audio.pause();
    audio.src = '';
    delete audio.dataset.retried;

    // Remove any previous metadata listener before adding a new one
    audio.onloadedmetadata = null;

    audio.load();

    if (!songUrl) return;

// iOS WebView fires loadedmetadata twice — once with a wrong duration,
// then again with the correct one. We wait for a stable value.
let metaDuration = 0;
let metaStableTimer: ReturnType<typeof setTimeout>;

const onMeta = () => {
  const reported = audio.duration;
  if (!reported || !isFinite(reported)) return;

  // If this is the first fire, record it and wait briefly
  // to see if a second (corrected) event comes in
  if (metaDuration === 0) {
    metaDuration = reported;
    metaStableTimer = setTimeout(() => {
      // No second event came — use what we have
      setDuration(audio.duration);
      audio.removeEventListener('loadedmetadata', onMeta);
    }, 800);
    return;
  }

  // Second event fired — use the latest value (the correct one)
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
      }).catch(() => { setIsLoading(false); });
    }, 100);

   return () => {
  clearTimeout(timer);
  clearTimeout(metaStableTimer);  // add this
  audio.removeEventListener('loadedmetadata', onMeta);
};
  }, [songUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.src && playCount > 0) {
      audio.currentTime = 0;
      safePlay(audio);
    }
  }, [playCount]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;
    isPlaying ? audio.pause() : safePlay(audio).catch(() => {});
  };

  const handleNext = () => playerRef.current.playNext();
  const handlePrevious = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setPosition(0);
    } else {
      playerRef.current.playPrevious();
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setPosition(value);
    }
  };

  const toggleMute = () => setVolume(prev => prev === 0 ? 1 : 0);

  useMediaSession(
    isPlaying,
    (song ?? {}) as Song,
    audioRef,
    () => { audioRef.current && safePlay(audioRef.current).catch(() => {}); },
    () => { audioRef.current?.pause(); }
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
      {isExpanded && <ExpandedPlayer {...sharedProps} onClose={() => setIsExpanded(false)} />}
      <div className="fixed bottom-0 bg-neutral-950/95 backdrop-blur-md w-full h-[100px] border-t border-red-900/40 px-4 z-[40]">
        <PlayerContent {...sharedProps} onExpand={() => setIsExpanded(true)} />
      </div>
    </>
  );
};

export default Player;