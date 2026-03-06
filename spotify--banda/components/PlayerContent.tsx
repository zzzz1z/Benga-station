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

  // Two audio refs — the dual session trick.
  // activeRef always points to whichever is currently the "main" playing element.
  // When skipping, we start loading the next song in the inactive element while
  // the active one keeps playing, then swap once the new one is ready.
  // This ensures iOS never sees a gap in audio and never reclaims the media session.
  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<'A' | 'B'>('A');

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const getActive = useCallback(() => {
    return activeRef.current === 'A' ? audioRefA.current : audioRefB.current;
  }, []);

  const getInactive = useCallback(() => {
    return activeRef.current === 'A' ? audioRefB.current : audioRefA.current;
  }, []);

  const attachListeners = useCallback((audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => setPosition(audio.currentTime);
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => player.playNext();
  }, [player]);

  // Wire up listeners to initial active element on mount and start playing
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    audio.src = songUrl;
    audio.volume = volume;
    attachListeners(audio);
    audio.play().catch(() => {});

    return () => {
      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When songUrl changes (i.e. player.activeID changed), load into inactive
  // element while active keeps playing, then swap — no audio gap for iOS
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip on first render — mount effect above handles it
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const inactive = getInactive();
    const active = getActive();
    if (!inactive || !active) return;

    inactive.src = songUrl;
    inactive.volume = volume;
    inactive.load();

    const onCanPlay = () => {
      // Stop old active and strip its listeners
      active.pause();
      active.ontimeupdate = null;
      active.onloadedmetadata = null;
      active.onplay = null;
      active.onpause = null;
      active.onended = null;

      // Swap
      activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
      const newActive = getActive();
      if (!newActive) return;

      attachListeners(newActive);
      newActive.play().catch(() => {});
      setPosition(0);
      setDuration(newActive.duration || 0);

      // Update proxy so useMediaSession always talks to the right element
      proxyRef.current = newActive;
    };

    inactive.addEventListener('canplay', onCanPlay, { once: true });
    return () => inactive.removeEventListener('canplay', onCanPlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl]);

  // Keep volume in sync on both elements
  useEffect(() => {
    if (audioRefA.current) audioRefA.current.volume = volume;
    if (audioRefB.current) audioRefB.current.volume = volume;
  }, [volume]);

  const handlePlay = () => {
    const audio = getActive();
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error("Audio play failed:", err));
    }
  };

  const handlePlayNextSong = () => player.playNext();

  const handlePlayPreviousSong = () => {
    const audio = getActive();
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      player.playPrevious();
    }
  };

  const handleSeek = (value: number) => {
    const audio = getActive();
    if (audio) {
      audio.currentTime = value;
      setPosition(value);
    }
  };

  const toggleMute = () => setVolume(prev => prev === 0 ? 1 : 0);

  // Proxy ref always points to whichever audio element is currently active
  // useMediaSession reads this ref directly so it always controls the right one
  const proxyRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    proxyRef.current = getActive();
  });

  useMediaSession(isPlaying, song, proxyRef);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center justify-between w-full">
      {/* Two hidden audio elements — only one plays at a time */}
      <audio ref={audioRefA} preload="auto" hidden />
      <audio ref={audioRefB} preload="auto" hidden />

      {/* Song Info */}
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