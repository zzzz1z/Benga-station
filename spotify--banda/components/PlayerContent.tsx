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

  // isPaused tracks user intent — the audio element itself never actually pauses
  // on iOS so the media session stays alive. We just mute it instead.
  const isPausedRef = useRef(false);
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

  // "Pause" = mute + freeze position updates, keep audio playing silently
  const fakePause = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    isPausedRef.current = true;
    audio.volume = 0;
    setIsPlaying(false);
  }, [getActive]);

  // "Play" = restore volume, mark as playing
  const fakePlay = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    isPausedRef.current = false;
    audio.volume = volume;
    setIsPlaying(true);
    // If audio genuinely stopped (e.g. ended), restart it
    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }, [getActive, volume]);

  const attachListeners = useCallback((audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => {
      // Don't advance position when user has "paused"
      if (!isPausedRef.current) {
        setPosition(audio.currentTime);
      }
    };
    audio.onloadedmetadata = () => setDuration(audio.duration);
    // Don't reflect native play/pause state — we manage it via fakePause/fakePlay
    audio.onplay = () => {};
    audio.onpause = () => {};
    audio.onended = () => {
      if (!isPausedRef.current) player.playNext();
    };
  }, [player]);

  // Mount: wire up first element and start playing
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    audio.src = songUrl;
    audio.volume = volume;
    attachListeners(audio);
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {});

    return () => {
      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Song change: load next into inactive while active keeps playing, then swap
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const inactive = getInactive();
    const active = getActive();
    if (!inactive || !active) return;

    inactive.src = songUrl;
    // Load at 0 volume so there's no bleed during buffering
    inactive.volume = 0;
    inactive.load();

    const onCanPlay = () => {
      // Strip listeners from old active
      active.ontimeupdate = null;
      active.onloadedmetadata = null;
      active.onplay = null;
      active.onpause = null;
      active.onended = null;
      // Mute and stop old active
      active.volume = 0;
      active.pause();

      // Swap
      activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
      const newActive = getActive();
      if (!newActive) return;

      attachListeners(newActive);
      // Restore volume only if user hasn't paused
      newActive.volume = isPausedRef.current ? 0 : volume;
      newActive.play().then(() => {
        if (!isPausedRef.current) setIsPlaying(true);
      }).catch(() => {});
      setPosition(0);
      setDuration(newActive.duration || 0);
      proxyRef.current = newActive;
    };

    inactive.addEventListener('canplay', onCanPlay, { once: true });
    return () => inactive.removeEventListener('canplay', onCanPlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl]);

  // Volume changes should only affect active element when not "paused"
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    if (!isPausedRef.current) {
      audio.volume = volume;
    }
  }, [volume, getActive]);

  const handlePlay = () => {
    if (isPlaying) {
      fakePause();
    } else {
      fakePlay();
    }
  };

  const handlePlayNextSong = () => player.playNext();

  const handlePlayPreviousSong = () => {
    const audio = getActive();
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPosition(0);
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

  const proxyRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    proxyRef.current = getActive();
  });

  // Pass fakePause/fakePlay to media session so lock screen buttons use same logic
  useMediaSession(isPlaying, song, proxyRef, fakePlay, fakePause);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center justify-between w-full">
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