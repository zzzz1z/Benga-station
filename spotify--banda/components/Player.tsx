'use client';

import { useEffect, useRef, useState } from "react";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import usePlayer, { loadFromSession } from "@/hooks/usePlayer";
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

  const activeID   = usePlayer(state => state.activeID);
  const playCount  = usePlayer(state => state.playCount);
  const songsMap   = usePlayer(state => state.songs);

  const lastGoodSongRef = useRef<Song | null>(null);
  const songFromStore   = activeID ? songsMap[activeID] : null;
  if (songFromStore && activeID) lastGoodSongRef.current = songFromStore;
  const song = songFromStore ?? lastGoodSongRef.current;

  const songUrl  = useLoadSongUrl((song ?? {}) as Song);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume,    setVolume]    = useState(1);
  const [duration,  setDuration]  = useState(0);
  const [position,  setPosition]  = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const volumeRef          = useRef(1);
  const isPlayingRef       = useRef(false);
  const skipOnErrorRef     = useRef(false);
  const endedFiredRef      = useRef(false);
  const shouldBePlayingRef = useRef(false);

  useEffect(() => { volumeRef.current    = volume;    }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const handleEnded = () => {
    if (endedFiredRef.current) return;
    endedFiredRef.current = true;
    playerRef.current.playNext();
    setTimeout(() => { endedFiredRef.current = false; }, 1000);
  };

  // Record play event + priority window preextract on song change
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
    // crossOrigin removed — YouTube CDN URLs don't support CORS
    const audio = new Audio();
    audioRef.current = audio;

    let lastTime = 0;
    let stuckInterval: NodeJS.Timeout;

    audio.ontimeupdate = () => { setPosition(audio.currentTime); };
    audio.onended      = handleEnded;
    audio.onplay       = () => { setIsPlaying(true); setIsLoading(false); };
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

    // Background stuck check — handles locked screen / backgrounded transitions
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
      audio.src = songUrl;
      audio.volume = volumeRef.current;
      audio.load();

      safePlay(audio).then(() => {
        setIsPlaying(true);
        setPosition(0);
        shouldBePlayingRef.current = true;
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
    if (audio && audio.src && playCount > 0) {
      audio.currentTime = 0;
      safePlay(audio);
    }
  }, [playCount]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;
    if (isPlaying) {
      audio.pause();
      shouldBePlayingRef.current = false;
    } else {
      safePlay(audio).catch(() => {});
      shouldBePlayingRef.current = true;
    }
  };

  const handleNext     = () => playerRef.current.playNext();
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
    () => { safePlay(audioRef.current!).catch(() => {}); shouldBePlayingRef.current = true;  },
    () => { audioRef.current?.pause();                    shouldBePlayingRef.current = false; }
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
      <div className="fixed bottom-0 bg-neutral-950/95 backdrop-blur-md w-full h-[100px] pb-[30px] border-t border-red-900/40 px-4 z-[40]">
        <PlayerContent {...sharedProps} onExpand={() => setIsExpanded(true)} />
      </div>
    </>
  );
};

export default Player;