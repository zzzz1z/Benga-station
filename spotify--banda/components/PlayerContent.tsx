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
      return <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />;
    }
    return isPlaying
      ? <BsPauseFill size={size} className="text-red-500" />
      : <BsPlayFill size={size} className="text-red-500" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center justify-between w-full">

      {/* Song info */}
      <div className="flex items-center space-x-4 min-w-0">
        <div
          onClick={onExpand}
          className="cursor-pointer flex items-center gap-x-3 flex-1 min-w-0"
        >
          <div className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden">
            <Image
              fill
              src={imageUrl ?? '/images/likedit.png'}
              alt={song.title}
              className="object-cover"
              sizes="48px"
              unoptimized
            />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-white text-sm font-medium truncate">{song.title}</p>
            <p className="text-neutral-400 text-xs truncate">{song.author}</p>
          </div>
        </div>
        <LikedButton songId={String(song.id)} />
      </div>

      {/* Controls Desktop */}
      <div className="hidden md:flex items-center justify-center w-full mb-2 flex-col">
        <div className="flex justify-center items-center w-full max-w-[700px] gap-4">
          <AiFillStepBackward onClick={onPrevious} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
          <div onClick={onPlay}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-2 cursor-pointer">
            {renderPlayButton(30)}
          </div>
          <AiFillStepForward onClick={onNext} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
        </div>
        <div className="w-full px-4">
          <MusicSlider value={position} onChange={onSeek} max={duration} />
        </div>
      </div>

      {/* Controls Mobile */}
      <div className="flex md:hidden justify-center items-center flex-col">
        <div className="flex items-center justify-center w-full">
          <AiFillStepBackward onClick={onPrevious} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
          <div onClick={onPlay}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white p-2 cursor-pointer">
            {renderPlayButton(20)}
          </div>
          <AiFillStepForward onClick={onNext} size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
        </div>
        <div className="w-full px-4">
          <MusicSlider value={position} onChange={onSeek} max={duration} />
        </div>
      </div>

      {/* Volume */}
      <div className="hidden md:flex w-full justify-end pr-4 min-w-0">
        <div className="flex items-center gap-4 w-[150px]">
          <VolumeIcon onClick={onToggleMute} className="cursor-pointer" size={34} />
          <Slider value={volume} onChange={onVolumeChange} />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;