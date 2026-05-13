'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IoClose } from 'react-icons/io5';
import { FaSpotify, FaYoutube } from 'react-icons/fa';
import { useImportPlaylist } from '@/hooks/useImportPlaylist';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function detectPlatform(url: string): 'spotify' | 'youtube' | null {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const { state, importPlaylist, reset } = useImportPlaylist();
  const router = useRouter();

  const platform = detectPlatform(url);
  const isRunning = state.status === 'fetching' || state.status === 'matching' || state.status === 'progress';
  const isDone = state.status === 'done';
  const isError = state.status === 'error';

  const progressPercent = state.total > 0
    ? Math.round((state.imported / state.total) * 100)
    : 0;

  useEffect(() => {
    if (!isOpen) {
      setTimeout(reset, 300);
      setUrl('');
    }
  }, [isOpen, reset]);

  const handleSubmit = () => {
    if (!url.trim() || isRunning) return;
    importPlaylist(url.trim());
  };

  const handleDone = () => {
    if (state.playlistId) {
      router.push(`/playlists/${state.playlistId}`);
      router.refresh();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isRunning ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col gap-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Importar Playlist</h2>
          {!isRunning && (
            <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
              <IoClose size={22} />
            </button>
          )}
        </div>

        {/* Idle / input state */}
        {!isRunning && !isDone && (
          <>
            <p className="text-neutral-400 text-sm">
              Cola o link de uma playlist do Spotify ou YouTube.
            </p>

            {/* URL input */}
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="https://open.spotify.com/playlist/... ou youtube.com/playlist?list=..."
                className="w-full bg-neutral-800 text-white text-sm rounded-xl px-4 py-3 pr-10 outline-none border border-white/10 focus:border-white/30 transition placeholder:text-neutral-600"
              />
              {/* Platform icon */}
              {platform === 'spotify' && (
                <FaSpotify className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
              )}
              {platform === 'youtube' && (
                <FaYoutube className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
              )}
            </div>

            {/* Error message */}
            {isError && (
              <p className="text-red-400 text-sm">{state.message}</p>
            )}

            {/* Platform hints */}
            <div className="flex gap-x-3">
              <div className="flex items-center gap-x-1.5 text-neutral-500 text-xs">
                <FaSpotify size={12} className="text-green-600" />
                <span>Spotify</span>
              </div>
              <div className="flex items-center gap-x-1.5 text-neutral-500 text-xs">
                <FaYoutube size={12} className="text-red-600" />
                <span>YouTube</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!url.trim() || !platform}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-neutral-200 active:scale-95 transition"
            >
              Importar
            </button>
          </>
        )}

        {/* Running state */}
        {isRunning && (
          <div className="flex flex-col gap-y-4">
            <p className="text-neutral-300 text-sm">{state.message}</p>

            {/* Progress bar */}
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${state.status === 'fetching' || state.status === 'matching' ? 5 : progressPercent}%` }}
              />
            </div>

            {state.total > 0 && (
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{state.imported} importadas</span>
                <span>{state.total} total{state.failed > 0 ? ` · ${state.failed} falharam` : ''}</span>
              </div>
            )}

            <p className="text-neutral-600 text-xs text-center">
              Não feches esta janela enquanto importa...
            </p>
          </div>
        )}

        {/* Done state */}
        {isDone && (
          <div className="flex flex-col gap-y-4 items-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-white font-semibold">{state.message}</p>
            {state.failed > 0 && (
              <p className="text-neutral-500 text-xs">
                {state.failed} músicas não foram encontradas no YouTube.
              </p>
            )}
            <button
              onClick={handleDone}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-95 transition"
            >
              Ver Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPlaylistModal;