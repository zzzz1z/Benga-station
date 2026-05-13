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
      className={`flex items-center gap-x-3 px-3 py-2 rounded-lg transition
        ${isCurrent ? 'bg-white/10' : dimmed ? 'opacity-50 hover:opacity-75 cursor-pointer' : 'hover:bg-white/5 cursor-pointer'}`}
    >
      <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
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
    </div>
  );
};

type RepeatMode = 'off' | 'all' | 'one';

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
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffleOn, setShuffleOn] = useState(false);

  const { ids, songs, activeID } = player;
  const currentIndex = ids.findIndex(id => id === activeID);

  const history = currentIndex > 0
    ? ids.slice(0, currentIndex).map(id => songs[id]).filter(Boolean) : [];
  const upcoming = currentIndex !== -1 && currentIndex < ids.length - 1
    ? ids.slice(currentIndex + 1).map(id => songs[id]).filter(Boolean) : [];
  const previewHistory = history.slice(-1);
  const previewUpcoming = upcoming.slice(0, 1);

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
    if (dragY > 100) onClose();
    setDragY(0);
    setIsDragging(false);
    touchStartY.current = null;
  };

  const handleNext = () => {
    if (repeatMode === 'one') { onSeek(0); return; }
    if (shuffleOn) { player.playRandom(); return; }
    onNext();
  };
  const cycleRepeat = () =>
    setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  const RepeatIcon = repeatMode === 'one' ? TbRepeatOnce : TbRepeat;

  const renderPlayButton = () => {
    if (isLoading) return <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />;
    return isPlaying
      ? <BsPauseFill size={32} className="text-black" />
      : <BsPlayFill size={32} className="text-black" />;
  };

  const hasQueue = history.length > 0 || upcoming.length > 0;

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
      {/* Drag pill */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-neutral-600" />
      </div>

      {/* Scrollable content */}
      <div className="flex flex-col flex-1 px-6 pt-2 pb-8 gap-y-5 overflow-y-auto">

        {/* Top bar */}
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

        {/* Flip card */}
        <div className="flex justify-center flex-shrink-0">
          <LyricsFlipCard song={song} position={position} />
        </div>

        {/* Title + like */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col min-w-0 flex-1 pr-4">
            <p className="text-white text-xl font-bold truncate">{song.title}</p>
            <p className="text-neutral-400 text-sm truncate mt-0.5">{song.author}</p>
          </div>
          <LikedButton songId={String(song.id)} />
        </div>

        {/* Seek bar */}
        <div className="flex-shrink-0">
          <MusicSlider value={position} onChange={onSeek} max={duration} />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-neutral-400 text-xs">{formatTime(position)}</span>
            <span className="text-neutral-400 text-xs">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
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

        {/* Shuffle + Repeat */}
        <div className="flex items-center justify-center gap-x-12 flex-shrink-0">
          <button
            onClick={() => setShuffleOn(prev => !prev)}
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

        {/* Queue panel */}
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
                <span className="text-[10px] text-neutral-600">
                  {history.length + 1 + upcoming.length} músicas
                </span>
                {queueExpanded ? <IoChevronUp size={14} /> : <IoChevronDown size={14} />}
              </div>
            </button>

            {!queueExpanded && (
              <div className="pb-2">
                {previewHistory.map((s, i) => (
                  <QueueRow
                    key={`prev-hist-${i}`}
                    song={s}
                    dimmed
                    onClick={() => {
                      const pid = ids[currentIndex - (previewHistory.length - i)];
                      player.setId(pid);
                    }}
                  />
                ))}
                <QueueRow song={song} isCurrent label="▶" />
                {previewUpcoming.map((s, i) => (
                  <QueueRow
                    key={`prev-up-${i}`}
                    song={s}
                    onClick={() => {
                      const pid = ids[currentIndex + 1 + i];
                      player.setId(pid);
                    }}
                  />
                ))}
              </div>
            )}

            {queueExpanded && (
              <div className="pb-2 max-h-72 overflow-y-auto">
                {history.length > 0 && (
                  <>
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest px-4 pt-1 pb-1">
                      Anteriores ({history.length})
                    </p>
                    {history.map((s, i) => (
                      <QueueRow
                        key={`hist-${i}`}
                        song={s}
                        dimmed
                        onClick={() => player.setId(ids[i])}
                      />
                    ))}
                  </>
                )}
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest px-4 pt-2 pb-1">
                  A tocar
                </p>
                <QueueRow song={song} isCurrent label="▶" />
                {upcoming.length > 0 && (
                  <>
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest px-4 pt-2 pb-1">
                      A seguir ({upcoming.length})
                    </p>
                    {upcoming.map((s, i) => (
                      <QueueRow
                        key={`up-${i}`}
                        song={s}
                        onClick={() => player.setId(ids[currentIndex + 1 + i])}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ExpandedPlayer;