'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
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
  // Prevents the songUrl effect from doing a second swap when onended
  // already handled it internally
  const skipNextSwapRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const volumeRef = useRef(1);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

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
    audio.volume = volumeRef.current;
    setIsPlaying(true);
    setPosition(pausedAtRef.current);
  }, [getActive]);

  const attachListenersRef = useRef<(audio: HTMLAudioElement) => void>(() => {});

  const swapToInactive = useCallback(() => {
    const active = getActive();
    const inactive = getInactive();
    if (!active || !inactive) return;

    active.ontimeupdate = null;
    active.onloadedmetadata = null;
    active.onplay = null;
    active.onpause = null;
    active.onended = null;
    active.volume = 0;
    active.pause();

    activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
    const newActive = activeRef.current === 'A' ? audioRefA.current : audioRefB.current;
    if (!newActive) return;

    isPausedRef.current = false;
    pausedAtRef.current = 0;

    attachListenersRef.current(newActive);
    newActive.volume = volumeRef.current;
    newActive.play().then(() => setIsPlaying(true)).catch(() => {});
    setPosition(0);
    if (newActive.duration && !isNaN(newActive.duration)) setDuration(newActive.duration);
    proxyRef.current = newActive;
  }, [getActive, getInactive]);

  const swapRef = useRef(swapToInactive);
  useEffect(() => { swapRef.current = swapToInactive; }, [swapToInactive]);

  const attachListeners = useCallback((audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => {
      if (!isPausedRef.current) {
        setPosition(audio.currentTime);
      }
    };
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onplay = () => {};
    audio.onpause = () => {};
    audio.onended = () => {
      skipNextSwapRef.current = true;
      swapRef.current();
      player.playNext();
    };
  }, [player]);

  useEffect(() => { attachListenersRef.current = attachListeners; }, [attachListeners]);

  // Mount
  const isFirstRender = useRef(true);
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    audio.src = songUrl;
    audio.volume = volumeRef.current;
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

  // External song change (manual skip)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // onended already swapped — just let Zustand catch up, don't swap again
    if (skipNextSwapRef.current) {
      skipNextSwapRef.current = false;
      return;
    }

    const inactive = getInactive();
    if (!inactive) return;

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
       // iOS doesn't always fire onended when seeking to end — trigger manually
    if (audio.duration && value >= audio.duration - 0.5) {
      player.playNext();
    }
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
          <AiFillStepBackward onClick={handlePlayPreviousSong} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
          <div onClick={handlePlay}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-2 cursor-pointer">
            <Icon size={30} className="text-red-500" />
          </div>
          <AiFillStepForward onClick={handlePlayNextSong} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
        </div>
        <div className="w-full px-4">
          <MusicSlider value={position} onChange={handleSeek} max={duration} />
        </div>
      </div>

      {/* Controls (Mobile) */}
      <div className="flex md:hidden justify-center items-center flex-col">
        <div className="flex items-center justify-center w-full">
          <AiFillStepBackward onClick={handlePlayPreviousSong} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
          <div onClick={handlePlay}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white p-2 cursor-pointer">
            <Icon size={20} className="text-red-500" />
          </div>
          <AiFillStepForward onClick={handlePlayNextSong} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
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