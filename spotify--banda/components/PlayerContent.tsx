'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import MediaItem from "./MediaItem";
import LikedButton from "./LikedButton";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import Slider from "./Slider";
import MusicSlider from "./MusicSlider";
import useMediaSession from "@/hooks/useMediaSession";

interface PlayerContentProps {
  song: Song;
  songUrl: string;
}

const PlayerContent: React.FC<PlayerContentProps> = ({ song, songUrl }) => {
  const player = usePlayer();

  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<'A' | 'B'>('A');

  const isPausedRef = useRef(false);
  const pausedAtRef = useRef(0);
  const preloadedUrlRef = useRef<string | null>(null);
  // When true, the songUrl effect must skip its swap — audio already swapped internally
  const skipNextSwapRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  // Next song info for pre-loading
  const nextSongId = (() => {
    const { ids, activeID } = player;
    if (!ids.length || !activeID) return undefined;
    const idx = ids.findIndex(id => id === activeID);
    if (idx === -1 || idx === ids.length - 1) return undefined;
    return ids[idx + 1];
  })();
  const nextSong = nextSongId ? player.songs[nextSongId] : null;
  const nextSongUrl = useLoadSongUrl(nextSong!);

  const getActive = useCallback(() =>
    activeRef.current === 'A' ? audioRefA.current : audioRefB.current
  , []);

  const getInactive = useCallback(() =>
    activeRef.current === 'A' ? audioRefB.current : audioRefA.current
  , []);

  const fakePause = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    isPausedRef.current = true;
    pausedAtRef.current = audio.currentTime;
    audio.volume = 0;
    setIsPlaying(false);
  }, [getActive]);

  const fakePlay = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    isPausedRef.current = false;
    audio.currentTime = pausedAtRef.current;
    audio.volume = volume;
    setIsPlaying(true);
    setPosition(pausedAtRef.current);
  }, [getActive, volume]);

  // Core swap: make inactive become active and start playing it
  // Does NOT call player.playNext() — caller is responsible for that
  const swapToInactive = useCallback(() => {
    const active = getActive();
    const inactive = getInactive();
    if (!active || !inactive) return;

    // Strip old active
    active.ontimeupdate = null;
    active.onloadedmetadata = null;
    active.onplay = null;
    active.onpause = null;
    active.onended = null;
    active.volume = 0;
    active.pause();

    // Swap
    activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
    const newActive = inactive; // inactive is now active after swap

    isPausedRef.current = false;
    pausedAtRef.current = 0;
    preloadedUrlRef.current = null;

    newActive.volume = volume;
    newActive.play().then(() => setIsPlaying(true)).catch(() => {});
    setPosition(0);
    if (newActive.duration && !isNaN(newActive.duration)) setDuration(newActive.duration);
    proxyRef.current = newActive;

    attachListenersRef.current(newActive);
  }, [getActive, getInactive, volume]);

  const swapRef = useRef(swapToInactive);
  useEffect(() => { swapRef.current = swapToInactive; }, [swapToInactive]);

  // Forward-declared so attachListeners can reference it
  const attachListenersRef = useRef<(audio: HTMLAudioElement) => void>(() => {});

  const attachListeners = useCallback((audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => {
      if (!isPausedRef.current) {
        setPosition(audio.currentTime);

        // Pre-load next song 10s before end
        if (
          nextSongUrl &&
          audio.duration > 0 &&
          !isNaN(audio.duration) &&
          audio.duration - audio.currentTime <= 10 &&
          preloadedUrlRef.current !== nextSongUrl
        ) {
          const inactive = getInactive();
          if (inactive) {
            preloadedUrlRef.current = nextSongUrl;
            inactive.src = nextSongUrl;
            inactive.volume = 0;
            inactive.load();
          }
        }
      }
    };
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onplay = () => {};
    audio.onpause = () => {};
    audio.onended = () => {
      // Mark that we're handling the swap internally so the songUrl
      // effect doesn't kick off a second swap when Zustand updates
      skipNextSwapRef.current = true;
      swapRef.current();
      player.playNext();
    };
  }, [player, nextSongUrl, getInactive]);

  useEffect(() => { attachListenersRef.current = attachListeners; }, [attachListeners]);

  // Re-attach listeners when nextSongUrl changes so pre-load URL is fresh
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    // Keep all existing handlers, just refresh ontimeupdate with new nextSongUrl
    const prev = audio.ontimeupdate;
    if (prev !== null) {
      // Only refresh if already attached (i.e. not first render)
      attachListeners(audio);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextSongUrl]);

  // Mount
  const isFirstRender = useRef(true);
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    audio.src = songUrl;
    audio.volume = volume;
    attachListeners(audio);
    audio.play().then(() => setIsPlaying(true)).catch(() => {});

    return () => {
      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External song change (manual skip via UI or lock screen)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // If onended already did the swap, skip — Zustand just caught up
    if (skipNextSwapRef.current) {
      skipNextSwapRef.current = false;
      return;
    }

    const inactive = getInactive();
    if (!inactive) return;

    // If we already pre-loaded this exact URL, swap immediately — no gap
    if (preloadedUrlRef.current === songUrl) {
      swapRef.current();
      return;
    }

    // Otherwise load and swap on ready
    inactive.src = songUrl;
    inactive.volume = 0;
    inactive.load();

    const onCanPlay = () => swapRef.current();
    inactive.addEventListener('canplay', onCanPlay, { once: true });
    return () => inactive.removeEventListener('canplay', onCanPlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl]);

  useEffect(() => {
    const audio = getActive();
    if (audio && !isPausedRef.current) audio.volume = volume;
  }, [volume, getActive]);

  const handlePlay = () => {
    if (isPlaying) fakePause();
    else fakePlay();
  };

  const handlePlayNextSong = () => player.playNext();

  const handlePlayPreviousSong = () => {
    const audio = getActive();
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      pausedAtRef.current = 0;
      setPosition(0);
    } else {
      player.playPrevious();
    }
  };

  const handleSeek = (value: number) => {
    const audio = getActive();
    if (audio) {
      audio.currentTime = value;
      pausedAtRef.current = value;
      setPosition(value);
    }
  };

  const toggleMute = () => setVolume(prev => prev === 0 ? 1 : 0);

  const proxyRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { proxyRef.current = getActive(); });

  useMediaSession(isPlaying, song, proxyRef, fakePlay, fakePause);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center justify-between w-full">
      <audio ref={audioRefA} preload="auto" hidden />
      <audio ref={audioRefB} preload="auto" hidden />

      <div className="flex items-center justify-center m-auto w-full space-x-4">
        <MediaItem data={song} />
        <LikedButton songId={song.id} />
      </div>

      {/* Controls (Desktop) */}
      <div className="hidden md:flex items-center justify-center w-full mb-2 flex-col">
        <div className="hidden md:flex justify-center items-center w-full max-w-[700px] gap-4">
          <AiFillStepBackward
            onClick={handlePlayPreviousSong}
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <div
            onClick={handlePlay}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-2 cursor-pointer"
          >
            <Icon size={30} className="text-red-500" />
          </div>
          <AiFillStepForward
            onClick={handlePlayNextSong}
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
        </div>
        <div className="w-full px-4">
          <MusicSlider value={position} onChange={handleSeek} max={duration} />
        </div>
      </div>

      {/* Controls (Mobile) */}
      <div className="flex md:hidden justify-center items-center flex-col">
        <div className="flex items-center justify-center w-full">
          <AiFillStepBackward
            onClick={handlePlayPreviousSong}
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <div
            onClick={handlePlay}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white p-2 cursor-pointer"
          >
            <Icon size={20} className="text-red-500" />
          </div>
          <AiFillStepForward
            onClick={handlePlayNextSong}
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
        </div>
        <div className="w-full px-4">
          <MusicSlider value={position} onChange={handleSeek} max={duration} />
        </div>
      </div>

      {/* Volume */}
      <div className="hidden md:flex w-full justify-end pr-4 min-w-0">
        <div className="flex items-center gap-4 w-[150px]">
          <VolumeIcon onClick={toggleMute} className="cursor-pointer" size={34} />
          <Slider value={volume} onChange={setVolume} />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;