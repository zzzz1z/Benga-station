'use client';

import { Song } from "@/types";
import useLoadImage from "@/hooks/useLoadImage";
import LikedButton from "./LikedButton";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import Slider from "./Slider";
import MusicSlider from "./MusicSlider";
import Image from "next/image";

interface PlayerContentProps {
  song: Song;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  volume: number;
  onPlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onExpand: () => void;
}

const PlayerContent: React.FC<PlayerContentProps> = ({
  song, isPlaying, isLoading, position, duration, volume,
  onPlay, onNext, onPrevious, onSeek, onVolumeChange, onToggleMute, onExpand,
}) => {
  const imageUrl = useLoadImage(song);
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const renderPlayButton = (size: number) => {
    if (isLoading) {
      return (
        <div
          className="border-2 border-red-500 border-t-transparent rounded-full animate-spin"
          style={{ width: size, height: size }}
        />
      );
    }
    return isPlaying
      ? <BsPauseFill size={size} className="text-red-600" />
      : <BsPlayFill size={size} className="text-red-600" />;
  };

  return (
    <div className="flex flex-col h-full justify-center relative">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-red-600/50 shadow-[0_0_10px_#ef4444]" />

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex md:hidden flex-col h-full justify-between py-2">
        {/* Row: art + title + prev/play/next */}
        <div className="flex items-center gap-x-3 flex-1 min-w-0">
          {/* Album art — tappable to expand */}
          <div
            onClick={onExpand}
            className="relative h-12 w-12 flex-shrink-0 border border-red-900/50 overflow-hidden cursor-pointer"
          >
            <Image
              fill
              src={imageUrl ?? '/images/likedit.png'}
              alt={song.title}
              className="object-cover"
              sizes="48px"
              unoptimized
            />
          </div>

          {/* Title + author */}
          <div
            onClick={onExpand}
            className="flex flex-col min-w-0 flex-1 cursor-pointer"
          >
            <p className="text-white text-sm font-black uppercase tracking-tighter truncate leading-tight">
              {song.title}
            </p>
            <p className="text-red-600/60 font-mono text-[10px] uppercase tracking-widest truncate">
              {song.author}
            </p>
          </div>

          {/* Controls: prev / play / next */}
          <div className="flex items-center gap-x-2 flex-shrink-0">
            <AiFillStepBackward
              onClick={onPrevious}
              size={20}
              className="text-neutral-500 cursor-pointer hover:text-red-500 transition active:scale-90"
            />
            <div
              onClick={onPlay}
              className="flex items-center justify-center h-9 w-9 border border-red-600/40 bg-red-600/5 cursor-pointer hover:bg-red-600/20 transition"
            >
              {renderPlayButton(20)}
            </div>
            <AiFillStepForward
              onClick={onNext}
              size={20}
              className="text-neutral-500 cursor-pointer hover:text-red-500 transition active:scale-90"
            />
          </div>
        </div>

        {/* Seek bar at bottom of player bar */}
        <div className="w-full pt-1">
          <MusicSlider value={position} onChange={onSeek} max={duration} />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:grid grid-cols-3 items-center w-full">
        {/* Song info */}
        <div className="flex items-center space-x-4 min-w-0">
          <div
            onClick={onExpand}
            className="cursor-pointer flex items-center gap-x-3 flex-1 min-w-0 group"
          >
            <div className="relative h-14 w-14 flex-shrink-0 rounded-none border border-red-900/50 overflow-hidden">
              <Image
                fill
                src={imageUrl ?? '/images/likedit.png'}
                alt={song.title}
                className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition"
                sizes="56px"
                unoptimized
              />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-white text-sm font-black uppercase tracking-tighter truncate">
                {song.title}
              </p>
              <p className="text-red-600/60 font-mono text-[10px] uppercase tracking-widest truncate">
                {song.author}
              </p>
            </div>
          </div>
          <LikedButton songId={String(song.id)} />
        </div>

        {/* Center controls */}
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex justify-center items-center gap-8 mb-1">
            <AiFillStepBackward
              onClick={onPrevious}
              size={24}
              className="text-neutral-500 cursor-pointer hover:text-red-500 transition active:scale-90"
            />
            <div
              onClick={onPlay}
              className="flex items-center justify-center h-10 w-10 border border-red-600/40 bg-red-600/5 cursor-pointer hover:bg-red-600/20 transition shadow-[0_0_10px_rgba(239,68,68,0.1)]"
            >
              {renderPlayButton(24)}
            </div>
            <AiFillStepForward
              onClick={onNext}
              size={24}
              className="text-neutral-500 cursor-pointer hover:text-red-500 transition active:scale-90"
            />
          </div>
          <div className="w-full max-w-[400px]">
            <MusicSlider value={position} onChange={onSeek} max={duration} />
          </div>
        </div>

        {/* Volume */}
        <div className="flex justify-end items-center pr-4 gap-x-3 w-[140px] ml-auto">
          <VolumeIcon
            onClick={onToggleMute}
            className="text-neutral-500 hover:text-red-500 cursor-pointer transition"
            size={24}
          />
          <Slider value={volume} onChange={onVolumeChange} />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;