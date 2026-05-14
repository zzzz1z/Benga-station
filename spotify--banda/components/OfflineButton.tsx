'use client';

import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { Song } from '@/types';
import { MdDownload, MdDownloadDone, MdDownloadForOffline } from 'react-icons/md';
import { AiOutlineClose } from 'react-icons/ai';
import toast from 'react-hot-toast';

interface OfflineButtonProps {
  song: Song;
  size?: number;
  className?: string;
}

const OfflineButton: React.FC<OfflineButtonProps> = ({ song, size = 18, className = '' }) => {
  const {
    isNative,
    isOffline,
    isDownloading,
    getProgress,
    saveForOffline,
    removeOffline,
  } = useOfflineStorage();

  // Don't render at all on web / non-native
  if (!isNative) return null;

  // Only works for YouTube songs
  if (song.source !== 'youtube' || !song.youtube_video_id) return null;

  const videoId = song.youtube_video_id;
  const cached = isOffline(videoId);
  const downloading = isDownloading(videoId);
  const progress = getProgress(videoId);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    toast('A guardar para offline...', { icon: '⬇️' });
    await saveForOffline(
      videoId,
      song.title,
      song.author,
      song.image_path ?? '',
    );
    toast.success('Guardado para offline!');
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await removeOffline(videoId);
    toast.success('Removido do offline');
  };

  if (downloading) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size + 8, height: size + 8 }}>
        {/* Progress ring */}
        <svg
          className="absolute inset-0"
          width={size + 8}
          height={size + 8}
          viewBox={`0 0 ${size + 8} ${size + 8}`}
        >
          <circle
            cx={(size + 8) / 2}
            cy={(size + 8) / 2}
            r={size / 2}
            fill="none"
            stroke="#dc2626"
            strokeOpacity={0.2}
            strokeWidth={2}
          />
          <circle
            cx={(size + 8) / 2}
            cy={(size + 8) / 2}
            r={size / 2}
            fill="none"
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray={`${Math.PI * size}`}
            strokeDashoffset={`${Math.PI * size * (1 - progress / 100)}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${(size + 8) / 2} ${(size + 8) / 2})`}
          />
        </svg>
        <span className="text-[8px] font-mono text-red-500 z-10">{progress}%</span>
      </div>
    );
  }

  if (cached) {
    return (
      <button
        onClick={handleRemove}
        className={`text-red-500 hover:text-red-300 transition ${className}`}
        title="Remover offline"
      >
        <MdDownloadDone size={size} />
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      className={`text-neutral-500 hover:text-red-500 transition ${className}`}
      title="Guardar para offline"
    >
      <MdDownload size={size} />
    </button>
  );
};

export default OfflineButton;