'use client';

import { useEffect, useRef, useState } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const volumeRef = useRef(1);
  const isPlayingRef = useRef(false);
  const positionRef = useRef(0);

  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  // Mount — create single audio element
  useEffect(() => {
    const audio = new Audio();
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      positionRef.current = audio.currentTime;
      setPosition(audio.currentTime);
    };
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onended = () => player.playNext();
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => {
      // Only update state if truly paused (not a src swap)
      if (!audio.src) return;
      setIsPlaying(false);
    };

    return () => {
      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.onended = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Song URL change — swap src and play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !songUrl) return;

    audio.src = songUrl;
    audio.volume = volumeRef.current;
    audio.load();
    audio.play().then(() => {
      setIsPlaying(true);
      setPosition(0);
      positionRef.current = 0;
    }).catch(() => {});
  }, [songUrl]);

  // Volume change
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handlePlayNextSong = () => player.playNext();

  const handlePlayPreviousSong = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPosition(0);
    } else {
      player.playPrevious();
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

  useMediaSession(isPlaying, song, audioRef, () => {
    audioRef.current?.play().catch(() => {});
  }, () => {
    audioRef.current?.pause();
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center justify-between w-full">
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