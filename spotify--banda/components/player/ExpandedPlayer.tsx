'use client';

import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { TbRepeat, TbRepeatOnce, TbArrowsShuffle, TbDatabaseImport } from "react-icons/tb";
import { MdDragHandle, MdClose } from "react-icons/md";
import useLoadImage from "@/hooks/useLoadImage";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import { QueueExtenderStatus } from '@/hooks/useQueueExtender';
import LikedButton from "../LikedButton";
import MusicSlider from "../MusicSlider";
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
  queueStatus: QueueExtenderStatus;
  queueFetchMore: () => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const QueueRow = ({
  song, label, isCurrent, dimmed, dragging,
  onDragStart, onClick, onRemove,
}: {
  song: Song; label?: string; isCurrent?: boolean; dimmed?: boolean; dragging?: boolean;
  onDragStart?: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: () => void;
  onRemove?: (e: React.MouseEvent) => void;
}) => {
  const imageUrl = useLoadImage(song);
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-x-3 px-3 py-2.5 transition select-none
        ${dragging ? 'opacity-40 bg-white/5' : ''}
        ${isCurrent
          ? 'bg-red-950/40 border-l-2 border-red-500'
          : dimmed
          ? 'opacity-40'
          : 'active:bg-white/5 cursor-pointer border-l-2 border-transparent'
        }`}
    >
      {!isCurrent && onDragStart ? (
        <div className="text-neutral-700 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          onMouseDown={onDragStart} onTouchStart={onDragStart} onClick={e => e.stopPropagation()}>
          <MdDragHandle size={16} />
        </div>
      ) : <div className="w-4 flex-shrink-0" />}
      <div className="relative w-9 h-9 overflow-hidden flex-shrink-0">
        <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
          className="object-cover" sizes="36px" unoptimized />
        {isCurrent && (
          <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
            <div className="flex gap-x-[2px] items-end h-3">
              {[1, 0.6, 0.8].map((h, i) => (
                <div key={i} className="w-[3px] bg-red-400 rounded-sm animate-pulse"
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-red-400' : 'text-neutral-200'}`}>{song.title}</p>
        <p className="text-neutral-600 text-[10px] truncate font-mono">{song.author}</p>
      </div>
      {!isCurrent && onRemove && (
        <button onClick={onRemove} className="flex-shrink-0 text-neutral-700 active:text-red-500 transition p-1">
          <MdClose size={12} />
        </button>
      )}
    </div>
  );
};

const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  song, isPlaying, isLoading, position, duration,
  onPlay, onNext, onPrevious, onSeek, onClose,
  queueStatus, queueFetchMore,
}) => {
  const queueContext = usePlayer(s => s.queueContext);
  const router = useRouter();
  const imageUrl = useLoadImage(song);

  const ids        = usePlayer(s => s.ids);
  const songs      = usePlayer(s => s.songs);
  const activeID   = usePlayer(s => s.activeID);
  const shuffleOn  = usePlayer(s => s.shuffleOn);
  const repeatMode = usePlayer(s => s.repeatMode);
  const setShuffleOn  = usePlayer(s => s.setShuffleOn);
  const setRepeatMode = usePlayer(s => s.setRepeatMode);
  const setId  = usePlayer(s => s.setId);
  const setIds = usePlayer(s => s.setIds);

  const [animState, setAnimState] = useState<'entering' | 'visible' | 'leaving'>('entering');
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setAnimState('visible')));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = useCallback(() => {
    setAnimState('leaving');
    setTimeout(() => onClose(), 380);
  }, [onClose]);

  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const handleTopBarTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTopBarTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  };
  const handleTopBarTouchEnd = () => {
    if (dragY > 100) { setDragY(0); handleClose(); } else setDragY(0);
    touchStartY.current = null;
  };

  const dragIndexRef     = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const rowHeightRef  = useRef(52);
  const dragStartYRef = useRef(0);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [queueExpanded, setQueueExpanded] = useState(false);

  const currentIndex = activeID ? ids.findIndex(id => id === activeID) : -1;
  const history: Song[] = currentIndex > 0
    ? ids.slice(0, currentIndex).map(id => songs[id]).filter((s): s is Song => !!s) : [];
  const upcoming: Song[] = currentIndex !== -1 && currentIndex < ids.length - 1
    ? ids.slice(currentIndex + 1).map(id => songs[id]).filter((s): s is Song => !!s) : [];

  const startQueueDrag = useCallback((globalIndex: number, clientY: number) => {
    dragIndexRef.current = globalIndex; dragOverIndexRef.current = globalIndex;
    dragStartYRef.current = clientY; setDraggingIndex(globalIndex); setDragOverIndex(globalIndex);
  }, []);

  const moveQueueDrag = useCallback((clientY: number) => {
    if (dragIndexRef.current === null) return;
    const steps    = Math.round((clientY - dragStartYRef.current) / rowHeightRef.current);
    const newIndex = Math.max(0, Math.min(ids.length - 1, dragIndexRef.current + steps));
    if (newIndex !== dragOverIndexRef.current) { dragOverIndexRef.current = newIndex; setDragOverIndex(newIndex); }
  }, [ids.length]);

  const endQueueDrag = useCallback(() => {
    if (dragIndexRef.current === null || dragOverIndexRef.current === null) return;
    const from = dragIndexRef.current, to = dragOverIndexRef.current;
    if (from !== to) {
      const newIds = [...ids];
      const [moved] = newIds.splice(from, 1);
      newIds.splice(to, 0, moved);
      setIds(newIds);
    }
    dragIndexRef.current = null; dragOverIndexRef.current = null;
    setDraggingIndex(null); setDragOverIndex(null);
  }, [ids, setIds]);

  const handleDragHandleDown = useCallback((globalIndex: number, e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startQueueDrag(globalIndex, clientY);
    const onMove = (ev: MouseEvent | TouchEvent) => moveQueueDrag('touches' in ev ? ev.touches[0].clientY : ev.clientY);
    const onUp   = () => {
      endQueueDrag();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
window.addEventListener('touchmove', onMove as any, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [startQueueDrag, moveQueueDrag, endQueueDrag]);

  const removeFromQueue = useCallback((globalIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIds(ids.filter((_, i) => i !== globalIndex));
  }, [ids, setIds]);





const handleQueueRowClick = useCallback((globalIndex: number) => {
    const clickedId = ids[globalIndex];
    if (!clickedId) return;
    if (clickedId.startsWith('yt_')) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoIds: [clickedId.slice(3)] }),
        }).catch(() => {});
    }
    setId(clickedId);
}, [ids, setId]);




  const handleNext = () => { if (repeatMode === 'one') { onSeek(0); return; } onNext(); };
  const cycleRepeat = () => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');
  const RepeatIcon  = repeatMode === 'one' ? TbRepeatOnce : TbRepeat;

  const progressPct = duration > 0 ? (position / duration) * 100 : 0;

  const renderPlayButton = () => {
    if (isLoading) return <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />;
    return isPlaying
      ? <BsPauseFill size={36} className="text-white" />
      : <BsPlayFill  size={36} className="text-white ml-1" />;
  };

  const hasQueue    = history.length > 0 || upcoming.length > 0;
  const allQueueRows = ids.map((id, i) => ({
    song: songs[id], globalIndex: i, isCurrent: id === activeID, isPast: i < currentIndex,
  })).filter(r => !!r.song);

  const slideY      = animState === 'entering' ? '100%' : animState === 'leaving' ? '100%' : dragY > 0 ? `${dragY}px` : '0%';
  const opacity     = animState === 'entering' ? 0 : animState === 'leaving' ? 0 : 1;
  const isAnimating = animState !== 'visible' || dragY > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111 60%, #0d0d0d 100%)',
        transform: `translateY(${slideY})`, opacity,
        transition: isAnimating && dragY === 0
          ? 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease'
          : dragY > 0 ? 'none'
          : 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease',
        willChange: 'transform, opacity',
      }}
    >
      {/* blurred album art bg */}
      {imageUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Image fill src={imageUrl} alt="" className="object-cover scale-110 blur-3xl opacity-10" unoptimized />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 60%, #0a0a0a 100%)' }} />
        </div>
      )}

      {/* scanline texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 3px)' }} />

      {/* top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-neutral-900 z-10">
        <div className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${progressPct}%`, boxShadow: '0 0 8px #ef4444' }} />
      </div>

{/* Top drag zone — respects iPhone safe area */}
      <div
        className="flex-shrink-0 select-none touch-none relative z-10 border-b border-white/5"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        onTouchStart={handleTopBarTouchStart} onTouchMove={handleTopBarTouchMove} onTouchEnd={handleTopBarTouchEnd}>

        {/* drag pill */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* header row */}
<div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={handleClose}
            className="text-neutral-400 active:text-white transition p-3 -ml-3"
            onTouchStart={e => e.stopPropagation()}
          >
            <IoChevronDown size={28} />
          </button>

<div className="flex flex-col items-center gap-y-0.5">
  <p className="text-neutral-500 text-[9px] font-mono uppercase tracking-[0.25em]">
    {queueContext.source === 'playlist' && queueContext.playlistName
      ? `▶ ${queueContext.playlistName}`
      : queueContext.source === 'search' && queueContext.searchQuery
      ? `⌕ ${queueContext.searchQuery}`
      : 'A tocar agora'}
  </p>
 <p
  className="text-white font-black uppercase tracking-tight whitespace-nowrap overflow-hidden max-w-[180px]"
  style={{ fontSize: `clamp(0.6rem, ${Math.max(0.6, 1.2 - song.title.length * 0.03)}rem, 0.875rem)` }}
>
  {song.title}
</p>
</div>

          <button
            onClick={handleClose}
            className="text-neutral-500 active:text-white transition p-3 -mr-3"
            onTouchStart={e => e.stopPropagation()}
          >
            <AiOutlineInfoCircle size={24} />
          </button>
        </div>
      </div>
      {/* Scrollable content */}
      <div className="flex flex-col flex-1 px-5 pb-8 gap-y-6 overflow-y-auto relative z-10">

        {/* Album art — large */}
        <div className="flex justify-center flex-shrink-0 mt-2">
          <div className="relative" style={{ width: 'min(72vw, 280px)', height: 'min(72vw, 280px)' }}>
            {/* corner accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-500 z-10" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-red-500 z-10" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-red-500 z-10" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-500 z-10" />
            <div className="absolute inset-0 overflow-hidden">
              <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
                className={`object-cover transition-all duration-700 ${isPlaying ? 'scale-100' : 'scale-95 brightness-75'}`}
                sizes="280px" unoptimized />
            </div>
            {/* playing glow */}
            {isPlaying && (
              <div className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 30px rgba(239,68,68,0.15), 0 0 40px rgba(239,68,68,0.1)' }} />
            )}
          </div>
        </div>

        {/* Song info + like */}
<div className="flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col min-w-0 flex-1 pr-4">
         <p
  className="text-white font-black uppercase tracking-tighter leading-tight whitespace-nowrap overflow-hidden"
  style={{
    textShadow: '0 0 20px rgba(239,68,68,0.2)',
    fontSize: `clamp(0.75rem, ${Math.max(1, 4 - song.title.length * 0.06)}rem, 2.5rem)`,
  }}
>
  {song.title}
</p>
            <p className="text-red-500/60 font-mono text-xs uppercase tracking-widest truncate mt-0.5">{song.author}</p>
          </div>
          <LikedButton songId={String(song.id)} />
        </div>

        {/* Seek bar */}
        <div className="flex-shrink-0">
          <MusicSlider value={position} onChange={onSeek} max={duration} />
          <div className="flex justify-between mt-1.5 px-0.5">
            <span className="text-neutral-600 text-[10px] font-mono tabular-nums">{formatTime(position)}</span>
            <span className="text-neutral-600 text-[10px] font-mono tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between flex-shrink-0 px-2">
          <button
            onClick={() => setShuffleOn(!shuffleOn)}
            className={`flex flex-col items-center gap-y-1 transition active:scale-90 p-2 ${shuffleOn ? 'text-red-500' : 'text-neutral-600'}`}
          >
            <TbArrowsShuffle size={22} />
          </button>

          <AiFillStepBackward onClick={onPrevious} size={32}
            className="text-neutral-300 cursor-pointer active:scale-90 transition active:text-white" />

          <div
            onClick={onPlay}
            className="flex items-center justify-center rounded-full cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 70, height: 70,
              background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
              boxShadow: isPlaying
                ? '0 0 30px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2)'
                : '0 0 15px rgba(239,68,68,0.2)',
            }}
          >
            {renderPlayButton()}
          </div>

          <AiFillStepForward onClick={handleNext} size={32}
            className="text-neutral-300 cursor-pointer active:scale-90 transition active:text-white" />

          <button
            onClick={cycleRepeat}
            className={`flex flex-col items-center gap-y-1 transition active:scale-90 p-2 ${repeatMode !== 'off' ? 'text-red-500' : 'text-neutral-600'}`}
          >
            <RepeatIcon size={22} />
          </button>
        </div>

        {/* mode labels */}
        <div className="flex items-center justify-between flex-shrink-0 px-4 -mt-4">
          <span className={`text-[9px] font-mono uppercase tracking-widest ${shuffleOn ? 'text-red-500' : 'text-neutral-700'}`}>
            {shuffleOn ? 'Aleatório on' : 'Aleatório'}
          </span>
          <span className={`text-[9px] font-mono uppercase tracking-widest ${repeatMode !== 'off' ? 'text-red-500' : 'text-neutral-700'}`}>
            {repeatMode === 'off' ? 'Repetir' : repeatMode === 'all' ? 'Repetir tudo' : 'Repetir uma'}
          </span>
        </div>

        {/* Lyrics flip card */}
        <div className="flex-shrink-0">
       <LyricsFlipCard key={song.id} song={song} position={position} duration={duration} isPlaying={isPlaying} />
        </div>

        {/* Queue extender */}
        {(queueStatus === 'fetching' || queueStatus === 'exhausted') && (
          <div className="flex-shrink-0 border border-white/10 overflow-hidden bg-white/5">
            {queueStatus === 'fetching' && (
              <div className="flex items-center gap-x-3 px-4 py-3">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-neutral-400 text-xs font-mono">A procurar mais músicas...</span>
              </div>
            )}
            {queueStatus === 'exhausted' && (
              <button onClick={queueFetchMore}
                className="w-full flex items-center gap-x-3 px-4 py-3 active:bg-white/5 transition text-left">
                <TbDatabaseImport size={18} className="text-red-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-white text-xs font-semibold">Fila a acabar</span>
                  <span className="text-neutral-500 text-[10px]">Toca aqui para buscar mais músicas</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Queue */}
        {hasQueue && (
          <div className="flex-shrink-0 border border-white/10 overflow-hidden">
            <button onClick={() => setQueueExpanded(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 text-neutral-500 active:text-white transition">
              <span className="text-[10px] font-mono uppercase tracking-widest">Fila de reprodução</span>
              <div className="flex items-center gap-x-2">
                <span className="text-[10px] text-neutral-700 font-mono">{ids.length}</span>
                {queueExpanded ? <IoChevronUp size={12} /> : <IoChevronDown size={12} />}
              </div>
            </button>

            {!queueExpanded && (
              <div className="pb-1">
                {history.slice(-1).map((s, i) => (
                  <QueueRow key={`h-${i}`} song={s} dimmed onClick={() => handleQueueRowClick(currentIndex - 1)} />
                ))}
                <QueueRow song={song} isCurrent />
                {upcoming.slice(0, 2).map((s, i) => (
                  <QueueRow key={`u-${i}`} song={s} onClick={() => handleQueueRowClick(currentIndex + 1 + i)} />
                ))}
              </div>
            )}

            {queueExpanded && (
              <div ref={containerRef} className="pb-1 max-h-72 overflow-y-auto">
                {allQueueRows.map(({ song: s, globalIndex, isCurrent, isPast }) => (
                  <QueueRow
                    key={`q-${globalIndex}`} song={s} isCurrent={isCurrent}
                    dimmed={isPast && !isCurrent} dragging={draggingIndex === globalIndex}
                    onDragStart={!isCurrent ? (e) => handleDragHandleDown(globalIndex, e) : undefined}
                    onRemove={!isCurrent ? (e) => removeFromQueue(globalIndex, e) : undefined}
                    onClick={!isCurrent ? () => handleQueueRowClick(globalIndex) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandedPlayer;