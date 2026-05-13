'use client';

import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import LikedButton from "./LikedButton";
import MusicSlider from "./MusicSlider";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward, AiOutlineInfoCircle } from "react-icons/ai";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { TbRepeat, TbRepeatOnce, TbArrowsShuffle } from "react-icons/tb";
import useLoadImage from "@/hooks/useLoadImage";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import LyricsFlipCard from "./LyricsFlipCard";

interface ExpandedPlayerProps {
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
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const QueueRow = ({
  song,
  label,
  isCurrent,
  dimmed,
  onClick,
}: {
  song: Song;
  label?: string;
  isCurrent?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}) => {
  const imageUrl = useLoadImage(song);
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-x-3 px-3 py-2 transition border-b border-white/5
        ${isCurrent ? 'bg-red-600/10' : dimmed ? 'opacity-40 hover:opacity-75 cursor-pointer' : 'hover:bg-white/5 cursor-pointer'}`}
    >
      <div className="relative w-8 h-8 flex-shrink-0 rounded-none border border-red-900/30 overflow-hidden">
        <Image
          fill
          src={imageUrl ?? '/images/likedit.png'}
          alt={song.title}
          className="object-cover"
          sizes="32px"
          unoptimized
        />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <p className={`text-[11px] font-black uppercase tracking-tight truncate ${isCurrent ? 'text-red-500' : 'text-neutral-300'}`}>
          {song.title}
        </p>
        <p className="text-neutral-500 font-mono text-[9px] uppercase truncate">{song.author}</p>
      </div>
      {label && <span className="text-[10px] text-red-600 animate-pulse font-bold">{label}</span>}
    </div>
  );
};

const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  song, isPlaying, isLoading, position, duration,
  onPlay, onNext, onPrevious, onSeek, onClose,
}) => {
  const router = useRouter();
  const player = usePlayer();

  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);

  const { ids, songs, activeID, shuffleOn, setShuffleOn, repeatMode, setRepeatMode } = player;

  const currentIndex = ids.findIndex(id => id === activeID);
  const history = currentIndex > 0 ? ids.slice(0, currentIndex).map(id => songs[id]).filter(Boolean) : [];
  const upcoming = currentIndex !== -1 && currentIndex < ids.length - 1 ? ids.slice(currentIndex + 1).map(id => songs[id]).filter(Boolean) : [];
  
  const previewHistory = history.slice(-1);
  const previewUpcoming = upcoming.slice(0, 1);

  // DRAG HANDLERS (Only for header)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  };
  const handleTouchEnd = () => {
    if (dragY > 120) onClose();
    setDragY(0);
    setIsDragging(false);
    touchStartY.current = null;
  };

  const handleNext = () => {
    if (repeatMode === 'one') { onSeek(0); return; }
    onNext();
  };

  const cycleRepeat = () =>
    setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');

  const RepeatIcon = repeatMode === 'one' ? TbRepeatOnce : TbRepeat;

  const renderPlayButton = () => {
    if (isLoading) return <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />;
    return isPlaying
      ? <BsPauseFill size={45} className="text-red-600" />
      : <BsPlayFill size={45} className="text-red-600 ml-1" />;
  };

  const hasQueue = history.length > 0 || upcoming.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col"
      style={{
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* ── DRAGGABLE HEADER ── */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col items-center pt-3 pb-4 cursor-grab active:cursor-grabbing border-b border-red-900/20"
      >
        <div className="w-12 h-1 rounded-full bg-red-600/30 mb-5" />
        <div className="flex items-center justify-between w-full px-6">
          <button onClick={onClose} className="text-red-600 p-2 -ml-2">
            <IoChevronDown size={28} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-red-600/50 tracking-[0.3em] uppercase">Status_Online</span>
            <p className="text-white text-xs font-black uppercase tracking-widest">A tocar agora</p>
          </div>
          <button
            onClick={() => { router.push(`/songs/${song.id}`); onClose(); }}
            className="text-neutral-500 hover:text-red-600 transition p-2 -mr-2"
          >
            <AiOutlineInfoCircle size={24} />
          </button>
        </div>
      </div>

      {/* ── MAIN SCROLLABLE CONTENT ── */}
      <div className="flex flex-col flex-1 px-8 pt-8 pb-12 gap-y-8 overflow-y-auto no-scrollbar">
        
        {/* Album Art / Lyrics */}
        <div className="flex justify-center flex-shrink-0">
          <LyricsFlipCard song={song} position={position} />
        </div>

        {/* Title & Info */}
        <div className="flex items-end justify-between flex-shrink-0 border-l-4 border-red-600 pl-4">
          <div className="flex flex-col min-w-0 flex-1 pr-4">
            <p className="text-white text-2xl font-black uppercase italic tracking-tighter truncate leading-none">
              {song.title}
            </p>
            <p className="text-red-600/80 font-mono text-xs uppercase tracking-[0.1em] mt-2">
              ID_{song.author.replace(/\s+/g, '_')}
            </p>
          </div>
          <LikedButton songId={String(song.id)} />
        </div>

        {/* Slider */}
        <div className="flex-shrink-0">
          <MusicSlider value={position} onChange={onSeek} max={duration} />
          <div className="flex justify-between mt-2 font-mono text-[10px] tracking-widest text-red-600/60">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between flex-shrink-0 px-2">
          <button
            onClick={() => setShuffleOn(!shuffleOn)}
            className={`transition ${shuffleOn ? 'text-red-500' : 'text-neutral-600'}`}
          >
            <TbArrowsShuffle size={26} />
          </button>

          <div className="flex items-center gap-x-8">
            <AiFillStepBackward onClick={onPrevious} size={38} className="text-white hover:text-red-500 transition cursor-pointer" />
            <div onClick={onPlay} className="flex items-center justify-center h-20 w-20 border-2 border-red-600/50 bg-red-600/5 rounded-none cursor-pointer hover:bg-red-600/10 transition shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              {renderPlayButton()}
            </div>
            <AiFillStepForward onClick={handleNext} size={38} className="text-white hover:text-red-500 transition cursor-pointer" />
          </div>

          <button
            onClick={cycleRepeat}
            className={`transition ${repeatMode !== 'off' ? 'text-red-500' : 'text-neutral-600'}`}
          >
            <RepeatIcon size={26} />
          </button>
        </div>

        {/* Queue panel */}
        {hasQueue && (
          <div className="flex-shrink-0 bg-neutral-900 border border-red-900/20 overflow-hidden mb-8">
            <button
              onClick={() => setQueueExpanded(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-950/10"
            >
              <div className="flex items-center gap-x-2">
                <div className="w-1.5 h-1.5 bg-red-600 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">
                  Buffer_Queue // {history.length + 1 + upcoming.length}
                </span>
              </div>
              {queueExpanded ? <IoChevronUp className="text-red-500" size={16} /> : <IoChevronDown className="text-red-500" size={16} />}
            </button>

            <div className={`transition-all duration-300 overflow-hidden ${queueExpanded ? 'max-h-[400px]' : 'max-h-[140px]'}`}>
              <div className="pb-2">
                 {/* This logic automatically shows just previews when collapsed, and everything when expanded */}
                 {!queueExpanded ? (
                   <>
                     {previewHistory.map((s, i) => <QueueRow key={i} song={s} dimmed onClick={() => player.setId(ids[currentIndex - 1])} />)}
                     <QueueRow song={song} isCurrent label="ACTIVE" />
                     {previewUpcoming.map((s, i) => <QueueRow key={i} song={s} onClick={() => player.setId(ids[currentIndex + 1])} />)}
                   </>
                 ) : (
                   <div className="overflow-y-auto max-h-[350px] no-scrollbar">
                      {history.map((s, i) => <QueueRow key={i} song={s} dimmed onClick={() => player.setId(ids[i])} />)}
                      <QueueRow song={song} isCurrent label="ACTIVE" />
                      {upcoming.map((s, i) => <QueueRow key={i} song={s} onClick={() => player.setId(ids[currentIndex + 1 + i])} />)}
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandedPlayer;