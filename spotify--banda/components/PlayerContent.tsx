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
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface PlayerSnapshot {
  ids: string[];
  songs: Record<string, Song>;
  activeID?: string;
}

const getNextSongUrl = (player: PlayerSnapshot): string | null => {
  const { ids, activeID, songs } = player;
  if (!ids.length || !activeID) return null;
  const currentIndex = ids.findIndex(id => id === activeID);
  if (currentIndex === -1 || currentIndex === ids.length - 1) return null;
  const nextSong = songs[ids[currentIndex + 1]];
  if (!nextSong) return null;
  const { data } = supabase.storage.from('musicas').getPublicUrl(nextSong.song_path);
  return data.publicUrl;
};

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

  // Preload the next song into the inactive element
  const preloadNext = useCallback(() => {
    const nextUrl = getNextSongUrl(player);
    const inactive = activeRef.current === 'A' ? audioRefB.current : audioRefA.current;
    if (!inactive || !nextUrl) return;
    inactive.src = nextUrl;
    inactive.volume = 0;
    inactive.load();
  }, [player]);

  const fakePause = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    isPausedRef.current = true;
    pausedAtRef.current = audio.currentTime;
    audio.volume = 0;
    audio.pause();
    setIsPlaying(false);
  }, [getActive]);

  const fakePlay = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    isPausedRef.current = false;
    audio.currentTime = pausedAtRef.current;
    audio.volume = volumeRef.current;
    audio.play().catch(() => {});
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
    newActive.play().then(() => {
      setIsPlaying(true);
      // Preload the song after next into the now-inactive element
      preloadNext();
    }).catch(() => {});
    setPosition(0);
    if (newActive.duration && !isNaN(newActive.duration)) setDuration(newActive.duration);
    proxyRef.current = newActive;
  }, [getActive, getInactive, preloadNext]);

  const swapRef = useRef(swapToInactive);
  useEffect(() => { swapRef.current = swapToInactive; }, [swapToInactive]);

  const attachListeners = useCallback((audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => {
      if (!isPausedRef.current) setPosition(audio.currentTime);
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
    audio.play().then(() => {
      setIsPlaying(true);
      preloadNext(); // preload next song as soon as current starts
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

  // External song change (manual skip)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

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
      if (audio.duration && value >= audio.duration - 0.5) {
        skipNextSwapRef.current = true;
        swapRef.current();
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