'use client';

import { useState } from 'react';
import { Song } from "@/types";
import useLoadImage from "@/hooks/useLoadImage";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { HiSpeakerWave, HiSpeakerXMark, HiSignal } from "react-icons/hi2";
import Image from "next/image";
import { SessionInfo } from "@/hooks/useSession";
import { QueueExtenderStatus } from '@/hooks/useQueueExtender';
import LikedButton from '../LikedButton';
import MusicSlider from '../MusicSlider';
import SessionPanel from '../SessionPanel';
import Slider from '../Slider';
import MarqueeText from '../MarqueeText';

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
  queueStatus: QueueExtenderStatus;
  queueFetchMore: () => void;
}

const PlayerContent: React.FC<PlayerContentProps> = ({
  song, isPlaying, isLoading, position, duration, volume,
  onPlay, onNext, onPrevious, onSeek, onVolumeChange, onToggleMute, onExpand,
  session, queueStatus, queueFetchMore,
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

  const showBanner = queueStatus === 'fetching' || queueStatus === 'done';

  return (
    <>
      {showSession && <SessionPanel onClose={() => setShowSession(false)} />}

      {showBanner && (
        <div className={`absolute bottom-full left-0 right-0 flex items-center justify-center gap-x-2 py-1 px-3 text-[9px] font-mono uppercase tracking-widest pointer-events-none
          ${queueStatus === 'fetching'
            ? 'bg-neutral-950/90 text-red-400/80 border-t border-red-900/30'
            : 'bg-neutral-950/90 text-green-400/80 border-t border-green-900/30'
          }`}
        >
          {queueStatus === 'fetching' && (<><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />A carregar mais músicas...</>)}
          {queueStatus === 'done' && (<><div className="w-1.5 h-1.5 rounded-full bg-green-500" />Músicas adicionadas à fila</>)}
        </div>
      )}

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

            {/* album art — tappable to expand */}
            <button
              onClick={onExpand}
              className="relative flex-shrink-0 cursor-pointer transition-transform"
              style={{ width: 56, height: 56 }}
            >
           
              <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
                className="object-cover" sizes="56px" unoptimized />
             
            </button>

            {/* song info — tappable to expand */}
            <button onClick={onExpand} className="flex flex-col min-w-0 flex-1 cursor-pointer text-left">
              <MarqueeText text={song.title} className="text-white text-sm font-black lowercase tracking-tighter leading-tight" />
              <p className="text-red-500/60 font-mono text-[10px] uppercase tracking-widest truncate">{song.author}</p>
            </button>

            {/* controls */}
            <div className="flex items-center gap-x-2 flex-shrink-0">
              <SessionButton small />
              <button
                onClick={onPrevious}
                disabled={!!isGuest}
                className={`transition  ${isGuest ? 'text-neutral-700 pointer-events-none' : 'text-neutral-400'}`}
              >
                <AiFillStepBackward size={22} />
              </button>
              <button
                onClick={onPlay}
                disabled={!!isGuest}
                className={`flex items-center justify-center rounded-full transition 
                  ${isGuest ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}
                  bg-neutral-800 border border-red-600/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]`}
                style={{ width: 42, height: 42 }}
              >
                {renderPlayButton(22)}
              </button>
              <button
                onClick={onNext}
                disabled={!!isGuest}
                className={`transition  ${isGuest ? 'text-neutral-700 pointer-events-none' : 'text-neutral-400'}`}
              >
                <AiFillStepForward size={22} />
              </button>
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
            <button onClick={onExpand} className="cursor-pointer relative h-[52px] w-[52px] flex-shrink-0 border border-red-900/50 overflow-hidden group">
              <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
                className="object-cover" sizes="52px" unoptimized />
            </button>
            <button onClick={onExpand} className="flex flex-col min-w-0 flex-1 cursor-pointer overflow-hidden text-left">
              <p className="text-white text-sm font-black uppercase tracking-tighter truncate">{song.title}</p>
              <p className="text-red-600/60 font-mono text-[10px] uppercase tracking-widest truncate">{song.author}</p>
            </button>
            <div className="flex-shrink-0">
              <LikedButton songId={song.id} initialLiked={true} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-shrink-0 w-[340px] xl:w-[420px] mx-6 gap-y-1.5">
            <div className="flex items-center gap-x-7">
              <button
                onClick={onPrevious}
                disabled={!!isGuest}
                className={`transition  ${isGuest ? 'text-neutral-700 pointer-events-none cursor-default' : 'text-neutral-400 cursor-pointer'}`}
              >
                <AiFillStepBackward size={22} />
              </button>
              <button
                onClick={onPlay}
                disabled={!!isGuest}
                className={`flex items-center justify-center h-10 w-10 border border-red-600/40 bg-red-600/5 shadow-[0_0_12px_rgba(239,68,68,0.15)] transition ${isGuest ? 'opacity-40 pointer-events-none cursor-default' : 'cursor-pointer'}`}
              >
                {renderPlayButton(22)}
              </button>
              <button
                onClick={onNext}
                disabled={!!isGuest}
                className={`transition  ${isGuest ? 'text-neutral-700 pointer-events-none cursor-default' : 'text-neutral-400 cursor-pointer'}`}
              >
                <AiFillStepForward size={22} />
              </button>
            </div>
            <div className="w-full">
              <MusicSlider value={position} onChange={onSeek} max={duration} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-3 flex-1 min-w-0">
            <SessionButton />
            <button onClick={onToggleMute} className="text-neutral-500 cursor-pointer transition flex-shrink-0">
              <VolumeIcon size={20} />
            </button>
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