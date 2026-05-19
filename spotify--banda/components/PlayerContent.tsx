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
import { QueueExtenderStatus } from '@/hooks/useQueueExtender';

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

  const renderPlayButton = (size: number) => {
    if (isLoading) return (
      <div className="border-2 border-red-500 border-t-transparent rounded-full animate-spin"
        style={{ width: size, height: size }} />
    );
    return isPlaying
      ? <BsPauseFill size={size} className="text-red-600" />
      : <BsPlayFill  size={size} className="text-red-600" />;
  };

  const SessionButton = ({ small = false }: { small?: boolean }) => (
    <button
      onClick={() => setShowSession(true)}
      className={`relative flex items-center gap-x-1 border transition flex-shrink-0 ${
        session
          ? 'border-red-500/60 text-red-400 bg-red-900/10 hover:bg-red-900/20'
          : 'border-neutral-700 text-neutral-500 hover:text-red-400 hover:border-red-900/40'
      } ${small ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}
      title="Sessão Conjunta"
    >
      <HiSignal size={small ? 14 : 16} />
      {session && memberCount > 1 && <span className="text-[10px] font-mono font-black">{memberCount}</span>}
      {session && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
    </button>
  );

  // Banner shown above the player bar when queue is fetching or just added songs
  const showBanner = queueStatus === 'fetching' || queueStatus === 'done';

  return (
    <>
      {showSession && <SessionPanel onClose={() => setShowSession(false)} />}

      {/* Queue extender banner — floats above the player */}
      {showBanner && (
        <div className={`absolute bottom-full left-0 right-0 flex items-center justify-center gap-x-2 py-1 px-3 text-[9px] font-mono uppercase tracking-widest pointer-events-none
          ${queueStatus === 'fetching'
            ? 'bg-neutral-950/90 text-red-400/80 border-t border-red-900/30'
            : 'bg-neutral-950/90 text-green-400/80 border-t border-green-900/30'
          }`}
        >
          {queueStatus === 'fetching' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              A carregar mais músicas...
            </>
          )}
          {queueStatus === 'done' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Músicas adicionadas à fila
            </>
          )}
        </div>
      )}

      <div className="flex flex-col h-full justify-center relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-red-600/50 shadow-[0_0_10px_#ef4444]" />

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
        <div className="flex md:hidden flex-col h-full justify-between py-2">
          <div className="flex items-center gap-x-3 flex-1 min-w-0">
            <div onClick={onExpand} className="relative h-12 w-12 flex-shrink-0 border border-red-900/50 overflow-hidden cursor-pointer">
              <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title} className="object-cover" sizes="48px" unoptimized />
            </div>
            <div onClick={onExpand} className="flex flex-col min-w-0 flex-1 cursor-pointer">
              <p className="text-white text-sm font-black uppercase tracking-tighter truncate leading-tight">{song.title}</p>
              <p className="text-red-600/60 font-mono text-[10px] uppercase tracking-widest truncate">{song.author}</p>
            </div>
            <div className="flex items-center gap-x-1.5 flex-shrink-0">
              <SessionButton small />
              <AiFillStepBackward onClick={onPrevious} size={20}
                className={`cursor-pointer transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none' : 'text-neutral-500 hover:text-red-500'}`} />
              <div onClick={onPlay}
                className={`flex items-center justify-center h-9 w-9 border border-red-600/40 bg-red-600/5 transition ${isGuest ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:bg-red-600/20'}`}>
                {renderPlayButton(20)}
              </div>
              <AiFillStepForward onClick={onNext} size={20}
                className={`cursor-pointer transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none' : 'text-neutral-500 hover:text-red-500'}`} />
            </div>
          </div>
          <div className="w-full pt-1">
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
              <LikedButton songId={String(song.id)} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-shrink-0 w-[340px] xl:w-[420px] mx-6 gap-y-1.5">
            <div className="flex items-center gap-x-7">
              <AiFillStepBackward onClick={onPrevious} size={22}
                className={`transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none cursor-default' : 'text-neutral-400 hover:text-red-500 cursor-pointer'}`} />
              <div onClick={onPlay}
                className={`flex items-center justify-center h-10 w-10 border border-red-600/40 bg-red-600/5 shadow-[0_0_12px_rgba(239,68,68,0.15)] transition ${isGuest ? 'opacity-40 pointer-events-none cursor-default' : 'cursor-pointer hover:bg-red-600/20'}`}>
                {renderPlayButton(22)}
              </div>
              <AiFillStepForward onClick={onNext} size={22}
                className={`transition active:scale-90 ${isGuest ? 'text-neutral-700 pointer-events-none cursor-default' : 'text-neutral-400 hover:text-red-500 cursor-pointer'}`} />
            </div>
            <div className="w-full">
              <MusicSlider value={position} onChange={onSeek} max={duration} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-3 flex-1 min-w-0">
            <SessionButton />
            <VolumeIcon onClick={onToggleMute}
              className="text-neutral-500 hover:text-red-500 cursor-pointer transition flex-shrink-0" size={20} />
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