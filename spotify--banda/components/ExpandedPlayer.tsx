'use client';

import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import LikedButton from "./LikedButton";
import MusicSlider from "./MusicSlider";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { TbRepeat, TbRepeatOnce, TbArrowsShuffle } from "react-icons/tb";
import { MdDragHandle, MdClose } from "react-icons/md";
import useLoadImage from "@/hooks/useLoadImage";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
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
  song, label, isCurrent, dimmed, dragging,
  onDragStart, onClick, onRemove,
}: {
  song: Song;
  label?: string;
  isCurrent?: boolean;
  dimmed?: boolean;
  dragging?: boolean;
  onDragStart?: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: () => void;
  onRemove?: (e: React.MouseEvent) => void;
}) => {
  const imageUrl = useLoadImage(song);
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-x-3 px-2 py-2 rounded-lg transition select-none
        ${dragging ? 'opacity-40 bg-white/5' : ''}
        ${isCurrent ? 'bg-white/10' : dimmed ? 'opacity-50' : 'hover:bg-white/5 cursor-pointer'}`}
    >
      {!isCurrent && onDragStart ? (
        <div
          className="text-neutral-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 px-1"
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onClick={e => e.stopPropagation()}
        >
          <MdDragHandle size={16} />
        </div>
      ) : (
        <div className="w-6 flex-shrink-0" />
      )}
      <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
        <Image fill src={imageUrl ?? '/images/likedit.png'} alt={song.title}
          className="object-cover" sizes="32px" unoptimized />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <p className={`text-xs font-medium truncate ${isCurrent ? 'text-white' : 'text-neutral-300'}`}>
          {song.title}
        </p>
        <p className="text-neutral-500 text-[10px] truncate">{song.author}</p>
      </div>
      {label && (
        <span className={`text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full font-medium
          ${isCurrent ? 'bg-white/20 text-white' : 'bg-white/10 text-neutral-400'}`}>
          {label}
        </span>
      )}
      {!isCurrent && onRemove && (
        <button onClick={onRemove}
          className="flex-shrink-0 text-neutral-700 hover:text-red-500 transition p-1">
          <MdClose size={12} />
        </button>
      )}
    </div>
  );
};

// Fire-and-forget warm for queue jumps
const warmFromIndex = (ids: string[], fromIndex: number, count = 3) => {
  const toWarm = ids.slice(fromIndex, fromIndex + count)
    .filter(id => id.startsWith('yt_'))
    .map(id => id.replace('yt_', ''));
  if (toWarm.length === 0) return;
  fetch('/api/warm-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds: toWarm }),
  }).catch(() => {});
};

const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  song, isPlaying, isLoading, position, duration,
  onPlay, onNext, onPrevious, onSeek, onClose,
}) => {
  const router = useRouter();

  const ids = usePlayer(s => s.ids);
  const songs = usePlayer(s => s.songs);
  const activeID = usePlayer(s => s.activeID);
  const shuffleOn = usePlayer(s => s.shuffleOn);
  const repeatMode = usePlayer(s => s.repeatMode);
  const setShuffleOn = usePlayer(s => s.setShuffleOn);
  const setRepeatMode = usePlayer(s => s.setRepeatMode);
  const setId = usePlayer(s => s.setId);
  const setIds = usePlayer(s => s.setIds);

  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);

  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const rowHeightRef = useRef(52);
  const dragStartYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = activeID ? ids.findIndex(id => id === activeID) : -1;

  const history: Song[] = currentIndex > 0
    ? ids.slice(0, currentIndex).map(id => songs[id]).filter((s): s is Song => !!s)
    : [];
  const upcoming: Song[] = currentIndex !== -1 && currentIndex < ids.length - 1
    ? ids.slice(currentIndex + 1).map(id => songs[id]).filter((s): s is Song => !!s)
    : [];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (draggingIndex !== null) return;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || draggingIndex !== null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  };
  const handleTouchEnd = () => {
    if (dragY > 100) onClose();
    setDragY(0);
    setIsDragging(false);
    touchStartY.current = null;
  };

  const startQueueDrag = useCallback((globalIndex: number, clientY: number) => {
    dragIndexRef.current = globalIndex;
    dragOverIndexRef.current = globalIndex;
    dragStartYRef.current = clientY;
    setDraggingIndex(globalIndex);
    setDragOverIndex(globalIndex);
  }, []);

  const moveQueueDrag = useCallback((clientY: number) => {
    if (dragIndexRef.current === null) return;
    const delta = clientY - dragStartYRef.current;
    const steps = Math.round(delta / rowHeightRef.current);
    const newIndex = Math.max(0, Math.min(ids.length - 1, dragIndexRef.current + steps));
    if (newIndex !== dragOverIndexRef.current) {
      dragOverIndexRef.current = newIndex;
      setDragOverIndex(newIndex);
    }
  }, [ids.length]);

  const endQueueDrag = useCallback(() => {
    if (dragIndexRef.current === null || dragOverIndexRef.current === null) return;
    const from = dragIndexRef.current;
    const to = dragOverIndexRef.current;
    if (from !== to) {
      const newIds = [...ids];
      const [moved] = newIds.splice(from, 1);
      newIds.splice(to, 0, moved);
      setIds(newIds);
    }
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [ids, setIds]);

  const handleDragHandleDown = useCallback((globalIndex: number, e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startQueueDrag(globalIndex, clientY);
    const onMove = (ev: MouseEvent | TouchEvent) => {
      const y = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      moveQueueDrag(y);
    };
    const onUp = () => {
      endQueueDrag();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove as any, { passive: true });
    window.addEventListener('touchend', onUp);
  }, [startQueueDrag, moveQueueDrag, endQueueDrag]);

  const removeFromQueue = useCallback((globalIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIds = ids.filter((_, i) => i !== globalIndex);
    setIds(newIds);
  }, [ids, setIds]);

  // Queue row click — optimistic setId + warm ahead
  const handleQueueRowClick = useCallback((globalIndex: number) => {
    const clickedId = ids[globalIndex];
    if (!clickedId) return;
    // Warm clicked + next 2 fire-and-forget
    warmFromIndex(ids, globalIndex, 3);
    // Optimistically jump
    setId(clickedId);
  }, [ids, setId]);

  const handleNext = () => {
    if (repeatMode === 'one') { onSeek(0); return; }
    onNext();
  };

  const cycleRepeat = () =>
    setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');

  const RepeatIcon = repeatMode === 'one' ? TbRepeatOnce : TbRepeat;

  const renderPlayButton = () => {
    if (isLoading) return <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />;
    return isPlaying
      ? <BsPauseFill size={32} className="text-black" />
      : <BsPlayFill size={32} className="text-black" />;
  };

  const hasQueue = history.length > 0 || upcoming.length > 0;
  const allQueueRows = ids.map((id, i) => ({
    song: songs[id],
    globalIndex: i,
    isCurrent: id === activeID,
    isPast: i < currentIndex,
  })).filter(r => !!r.song);

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900 flex flex-col"
      style={{
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-neutral-600" />
      </div>

      <div className="flex flex-col flex-1 px-6 pt-2 pb-8 gap-y-5 overflow-y-auto">

        <div className="flex items-center justify-between pt-[30px] flex-shrink-0">
          <button onClick={onClose} className="text-white p-2 -ml-2">
            <IoChevronDown size={26} />
          </button>
          <p className="text-white text-sm font-medium">A tocar agora</p>
          <button
            onClick={() => { router.push(`/songs/${song.id}`); onClose(); }}
            className="text-neutral-400 hover:text-white transition p-2 -mr-2"
          >
            <AiOutlineInfoCircle size={22} />
          </button>
        </div>

        <div className="flex justify-center flex-shrink-0">
<LyricsFlipCard song={song} position={position} duration={duration} />        </div>

        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col min-w-0 flex-1 pr-4">
            <p className="text-white text-xl font-bold truncate">{song.title}</p>
            <p className="text-neutral-400 text-sm truncate mt-0.5">{song.author}</p>
          </div>
          <div className="flex items-center gap-x-3 flex-shrink-0">
            <LikedButton songId={String(song.id)} />
          </div>
        </div>

        <div className="flex-shrink-0">
          <MusicSlider value={position} onChange={onSeek} max={duration} />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-neutral-400 text-xs">{formatTime(position)}</span>
            <span className="text-neutral-400 text-xs">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-x-10 flex-shrink-0">
          <AiFillStepBackward onClick={onPrevious} size={34}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
          <div onClick={onPlay}
            className="flex items-center justify-center h-16 w-16 rounded-full bg-white cursor-pointer shadow-lg">
            {renderPlayButton()}
          </div>
          <AiFillStepForward onClick={handleNext} size={34}
            className="text-neutral-400 cursor-pointer hover:text-white transition" />
        </div>

        <div className="flex items-center justify-center gap-x-12 flex-shrink-0">
          <button
            onClick={() => setShuffleOn(!shuffleOn)}
            className={`flex flex-col items-center gap-y-1 transition ${shuffleOn ? 'text-red-500' : 'text-neutral-400 hover:text-white'}`}
          >
            <TbArrowsShuffle size={24} />
            <span className="text-[10px]">Aleatório</span>
          </button>
          <button
            onClick={cycleRepeat}
            className={`flex flex-col items-center gap-y-1 transition ${repeatMode !== 'off' ? 'text-red-500' : 'text-neutral-400 hover:text-white'}`}
          >
            <RepeatIcon size={24} />
            <span className="text-[10px]">
              {repeatMode === 'off' ? 'Repetir' : repeatMode === 'all' ? 'Repetir tudo' : 'Repetir uma'}
            </span>
          </button>
        </div>

        {hasQueue && (
          <div className="flex-shrink-0 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <button
              onClick={() => setQueueExpanded(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 text-neutral-400 hover:text-white transition"
            >
              <span className="text-xs font-semibold uppercase tracking-widest">
                Fila de reprodução
              </span>
              <div className="flex items-center gap-x-2">
                <span className="text-[10px] text-neutral-600">{ids.length} músicas</span>
                {queueExpanded ? <IoChevronUp size={14} /> : <IoChevronDown size={14} />}
              </div>
            </button>

            {!queueExpanded && (
              <div className="pb-2">
                {history.slice(-1).map((s, i) => (
                  <QueueRow key={`prev-hist-${i}`} song={s} dimmed
                    onClick={() => handleQueueRowClick(currentIndex - 1)} />
                ))}
                <QueueRow song={song} isCurrent label="▶" />
                {upcoming.slice(0, 1).map((s, i) => (
                  <QueueRow key={`prev-up-${i}`} song={s}
                    onClick={() => handleQueueRowClick(currentIndex + 1)} />
                ))}
              </div>
            )}

            {queueExpanded && (
              <div ref={containerRef} className="pb-2 max-h-72 overflow-y-auto">
                {allQueueRows.map(({ song: s, globalIndex, isCurrent, isPast }) => (
                  <QueueRow
                    key={`q-${globalIndex}`}
                    song={s}
                    isCurrent={isCurrent}
                    dimmed={isPast && !isCurrent}
                    dragging={draggingIndex === globalIndex}
                    label={isCurrent ? '▶' : undefined}
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