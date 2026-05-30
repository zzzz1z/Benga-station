'use client';

import { useState } from 'react';
import { Song } from "@/types";
import useLoadImage from "@/hooks/useLoadImage";
import LikedButton from "./LikedButton";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { HiSpeakerWave, HiSpeakerXMark, HiSignal } from "react-icons/hi2";
import Slider from "./Slider";
import MusicSlider from "./MusicSlider";
import Image from "next/image";
import SessionPanel from "./SessionPanel";
import { SessionInfo } from "@/hooks/useSession";

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
  session: SessionInfo | null;

}

const PlayerContent: React.FC<PlayerContentProps> = ({
  song, isPlaying, isLoading, position, duration, volume,
  onPlay, onNext, onPrevious, onSeek, onVolumeChange, onToggleMute, onExpand,
  session
}) => {
  const imageUrl   = useLoadImage(song);
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;
  const [showSession, setShowSession] = useState(false);

  const isGuest     = session && !session.canControl;
  const memberCount = session?.members.length ?? 0;

  const progressPct = duration > 0 ? (position / duration) * 100 : 0;

  const renderPlayButton = (size: number) => {
    if (isLoading) return (
      <div className="border-2 border-red-500 border-t-transparent rounded-full animate-spin"
        style={{ width: size, height: size }} />
    );
    return isPlaying
      ? <BsPauseFill size={size} className="text-red-500" />
      : <BsPlayFill  size={size} className="text-red-500" />;
  };

  const SessionButton = ({ small = false }: { small?: boolean }) => (
    <button
      onClick={() => setShowSession(true)}
      className={`relative flex items-center gap-x-1 border transition flex-shrink-0 ${
        session
          ? 'border-red-500/60 text-red-400 bg-red-900/10'
          : 'border-neutral-700 text-neutral-500'
      } ${small ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}
      title="Sessão Conjunta"
    >
      <HiSignal size={small ? 14 : 16} />
      {session && memberCount > 1 && <span className="text-[10px] font-mono font-black">{memberCount}</span>}
      {session && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
    </button>
  );


  return (
    <>
      {showSession && <SessionPanel onClose={() => setShowSession(false)} />}



      <div className="flex flex-col h-full justify-center relative">
        {/* top glow line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-red-600/50 shadow-[0_0_10px_#ef4444]" />

        {/* progress bar under the glow line */}
        <div className="absolute top-0 left-0 h-[2px] bg-red-600/70 transition-all duration-300 md:hidden"
          style={{ width: `${progressPct}%`, boxShadow: '0 0 8px #ef4444' }} />

        {isGuest && (
          <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-red-900/30 border-x border-b border-red-900/40 px-3 py-0.5">
              <span className="text-[9px] font-mono text-red-400/80 uppercase tracking-widest">
                ● Sessão ao vivo · Só o host controla
              </span>
            </div>
          </div>
        )}

        {/* ── MOBILE ── */}
        <div className="flex md:hidden flex-col h-full justify-center gap-y-2 py-2">

          {/* top row — art + info + controls */}
          <div className="flex items-center gap-x-3">

            {/* album art — bigger, tappable to expand */}
            <div
              onClick={onExpand}
              className="relative flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{ width: 56, height: 56 }}
            >
              {/* red corner accent */}
              <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-red-500 z-10" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-red-500 z-10" />
              <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
                className="object-cover" sizes="56px" unoptimized />
              {/* playing pulse ring */}
              {isPlaying && (
                <div className="absolute inset-0 border border-red-500/40 animate-ping rounded-none" style={{ animationDuration: '2s' }} />
              )}
            </div>

            {/* song info — tappable to expand */}
            <div onClick={onExpand} className="flex flex-col min-w-0 flex-1 cursor-pointer">
              <p className="text-white text-sm font-black uppercase tracking-tighter truncate leading-tight">{song.title}</p>
              <p className="text-red-500/60 font-mono text-[10px] uppercase tracking-widest truncate">{song.author}</p>
            </div>

            {/* controls */}
            <div className="flex items-center gap-x-2 flex-shrink-0">
              <SessionButton small />
              <AiFillStepBackward
                onClick={onPrevious} size={22}
                className={`transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none' : 'text-neutral-400'}`}
              />
              <div
                onClick={onPlay}
                className={`flex items-center justify-center rounded-full transition active:scale-90
                  ${isGuest ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}
                  bg-neutral-800 border border-red-600/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]`}
                style={{ width: 42, height: 42 }}
              >
                {renderPlayButton(22)}
              </div>
              <AiFillStepForward
                onClick={onNext} size={22}
                className={`transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none' : 'text-neutral-400'}`}
              />
            </div>
          </div>

          {/* bottom row — slim seek bar */}
          <div className="w-full px-1">
            <MusicSlider value={position} onChange={onSeek} max={duration} />
          </div>
        </div>

        {/* ── DESKTOP ── */}
        <div className="hidden md:flex flex-row items-center w-full h-full px-2">

          <div className="flex items-center gap-x-3 flex-1 min-w-0 overflow-hidden">
            <div onClick={onExpand} className="cursor-pointer relative h-[52px] w-[52px] flex-shrink-0 border border-red-900/50 overflow-hidden group">
              <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
                className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition" sizes="52px" unoptimized />
            </div>
            <div onClick={onExpand} className="flex flex-col min-w-0 flex-1 cursor-pointer overflow-hidden">
              <p className="text-white text-sm font-black uppercase tracking-tighter truncate">{song.title}</p>
              <p className="text-red-600/60 font-mono text-[10px] uppercase tracking-widest truncate">{song.author}</p>
            </div>
            <div className="flex-shrink-0">
              <LikedButton songId={song.id} initialLiked={true} />

            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-shrink-0 w-[340px] xl:w-[420px] mx-6 gap-y-1.5">
            <div className="flex items-center gap-x-7">
              <AiFillStepBackward onClick={onPrevious} size={22}
                className={`transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none cursor-default' : 'text-neutral-400 cursor-pointer'}`} />
              <div onClick={onPlay}
                className={`flex items-center justify-center h-10 w-10 border border-red-600/40 bg-red-600/5 shadow-[0_0_12px_rgba(239,68,68,0.15)] transition ${isGuest ? 'opacity-40 pointer-events-none cursor-default' : 'cursor-pointer'}`}>
                {renderPlayButton(22)}
              </div>
              <AiFillStepForward onClick={onNext} size={22}
                className={`transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none cursor-default' : 'text-neutral-400 cursor-pointer'}`} />
            </div>
            <div className="w-full">
              <MusicSlider value={position} onChange={onSeek} max={duration} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-3 flex-1 min-w-0">
            <SessionButton />
            <VolumeIcon onClick={onToggleMute}
              className="text-neutral-500 cursor-pointer transition flex-shrink-0" size={20} />
            <div className="w-28 flex-shrink-0">
              <Slider value={volume} onChange={onVolumeChange} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default PlayerContent;