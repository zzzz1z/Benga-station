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

const preExtractAround = (currentId: string) => {
  const { ids } = usePlayer.getState();
  const currentIndex = ids.findIndex(id => id === currentId);
  const targets = [
    ids[currentIndex - 1],
    ids[currentIndex + 1],
    ids[currentIndex + 2],
  ].filter(Boolean);

  targets.forEach(id => {
    if (!id.startsWith('yt_')) return;
    const videoId = id.replace('yt_', '');
    fetch('/api/preextract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    }).catch(() => {});
  });
};

const Player = () => {
  const player = usePlayer();
  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; }, [player]);

  const song = player.activeID ? player.songs[player.activeID] : null;
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
  const positionRef = useRef(0);
  const skipOnErrorRef = useRef(false);

  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      positionRef.current = audio.currentTime;
      setPosition(audio.currentTime);
    };
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onended = () => playerRef.current.playNext();
    audio.onplay = () => { setIsPlaying(true); setIsLoading(false); };
    audio.onpause = () => {
      if (!audio.src) return;
      setIsPlaying(false);
    };
    audio.onwaiting = () => setIsLoading(true);
    audio.oncanplay = () => setIsLoading(false);

    audio.onerror = () => {
      if (!audio.src || !skipOnErrorRef.current) return;
      const currentId = playerRef.current.activeID;

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
      if (currentId) playerRef.current.markFailed(currentId);
    };

    const handleStuck = () => {
      setTimeout(async () => {
        if (isPlayingRef.current && audio.paused && audio.src) {
          await safePlay(audio);
        }
      }, 800);
    };

    audio.addEventListener("stalled", handleStuck);

    return () => {
      audio.removeEventListener("stalled", handleStuck);
      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.onended = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.onwaiting = null;
      audio.oncanplay = null;
      audio.onerror = null;
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
    audio.pause();
    audio.src = '';
    delete audio.dataset.retried;
    audio.load();

    if (!songUrl) return;

    const timer = setTimeout(() => {
      skipOnErrorRef.current = true;
      audio.src = songUrl;
      audio.volume = volumeRef.current;
      audio.load();

      safePlay(audio).then(() => {
        setIsPlaying(true);
        setPosition(0);
        positionRef.current = 0;
      }).catch(() => { setIsLoading(false); });

      if (song?.id) preExtractAround(song.id);
    }, 100);

    return () => clearTimeout(timer);
  }, [songUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;
    if (isPlaying) {
      audio.pause();
    } else {
      safePlay(audio).catch(() => {});
    }
  };

  const handleNext = () => playerRef.current.playNext();

  const handlePrevious = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPosition(0);
    } else {
      playerRef.current.playPrevious();
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setPosition(value);
    positionRef.current = value;
  };

  const toggleMute = () => setVolume(prev => prev === 0 ? 1 : 0);

  useMediaSession(
    isPlaying,
    (song ?? {}) as Song,
    audioRef,
    () => { const audio = audioRef.current; if (audio) safePlay(audio).catch(() => {}); },
    () => { audioRef.current?.pause(); }
  );

  if (!song || !player.activeID) return null;

  const sharedProps = {
    song,
    isPlaying,
    isLoading,
    position,
    duration,
    volume,
    onPlay: handlePlay,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onSeek: handleSeek,
onVolumeChange: (v: number) => { console.log('volume:', v); setVolume(v); },    onToggleMute: toggleMute,
  };

  return (
    <>
      {isExpanded && (
        <ExpandedPlayer
          {...sharedProps}
          onClose={() => setIsExpanded(false)}
        />
      )}
      <div className="fixed bottom-0 bg-black w-full py-2 h-[90px] mb-3 px-4">
        <PlayerContent
          {...sharedProps}
          onExpand={() => setIsExpanded(true)}
        />
      </div>
    </>
  );
};

export default Player;