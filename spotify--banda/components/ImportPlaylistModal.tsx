'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { IoClose } from 'react-icons/io5';
import { FaSpotify, FaYoutube } from 'react-icons/fa';
import { useImportPlaylist } from '@/hooks/useImportPlaylist';
import { markDataStale } from './FloatingRefreshButton';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function detectPlatform(url: string): 'spotify' | 'youtube' | null {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

const SUMMARY_TIMEOUT = 30;

const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [countdown, setCountdown] = useState(SUMMARY_TIMEOUT);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { state, importPlaylist, reset } = useImportPlaylist();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const platform = detectPlatform(url);
  const isRunning = state.status === 'fetching' || state.status === 'matching' || state.status === 'progress';
  const isDone    = state.status === 'done';
  const isError   = state.status === 'error';

  const progressPercent = state.total > 0
    ? Math.round((state.imported / state.total) * 100)
    : 0;

  useEffect(() => {
    if (!isDone) return;

    setShowSummary(true);
    setCountdown(SUMMARY_TIMEOUT);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleReload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isDone]);

const handleReload = () => {
  if (countdownRef.current) clearInterval(countdownRef.current);
  setShowSummary(false);
  markDataStale();
  onClose();
  if (state.playlistId) {
    window.location.href = `/playlists?id=${state.playlistId}`;
  } else {
    window.location.reload();
  }
};

  useEffect(() => {
    if (!isOpen) {
      setTimeout(reset, 300);
      setUrl('');
      setShowSummary(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [isOpen, reset]);

  const handleSubmit = () => {
    if (!url.trim() || isRunning) return;
    importPlaylist(url.trim());
  };

  if (!mounted || !isOpen) return null;

  if (showSummary) {
    return createPortal(
      <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 9999 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col gap-y-4" style={{ zIndex: 10000 }}>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-y-0.5">
              <h2 className="text-white font-bold text-lg">Importação concluída</h2>
              {state.playlistName && (
                <p className="text-neutral-500 text-xs truncate max-w-[280px]">{state.playlistName}</p>
              )}
            </div>
            <button onClick={handleReload} className="text-neutral-400">
              <IoClose size={22} />
            </button>
          </div>

          <div className="flex gap-x-6 text-sm">
            <div className="flex flex-col items-center gap-y-1">
              <span className="text-2xl font-black text-white">{state.imported}</span>
              <span className="text-neutral-500 text-xs">importadas</span>
            </div>
            {state.failed > 0 && (
              <div className="flex flex-col items-center gap-y-1">
                <span className="text-2xl font-black text-red-400">{state.failed}</span>
                <span className="text-neutral-500 text-xs">falharam</span>
              </div>
            )}
          </div>

          {state.failedSongs.length > 0 && (
            <div className="flex flex-col gap-y-1 max-h-48 overflow-y-auto">
              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Não encontradas</p>
              {state.failedSongs.map((s, i) => (
                <div key={i} className="flex flex-col px-3 py-2 bg-neutral-800 rounded-lg">
                  <span className="text-white text-sm font-medium truncate">{s.title}</span>
                  <span className="text-neutral-500 text-xs truncate">{s.artist}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleReload}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm "
          >
            Ver Playlist ({countdown}s)
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const modal = (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 9999 }}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isRunning ? onClose : undefined}
      />
      <div className="relative w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col gap-y-5" style={{ zIndex: 10000 }}>

        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Importar Playlist</h2>
          {!isRunning && (
            <button onClick={onClose} className="text-neutral-400">
              <IoClose size={22} />
            </button>
          )}
        </div>

        {!isRunning && !isDone && (
          <>
            <p className="text-neutral-400 text-sm">
              Cola o link de uma playlist do Spotify ou YouTube.
            </p>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="https://open.spotify.com/playlist/... ou youtube.com/playlist?list=..."
                className="w-full bg-neutral-800 text-white text-sm rounded-xl px-4 py-3 pr-10 outline-none border border-white/10 focus:border-white/30 transition placeholder:text-neutral-600"
              />
              {platform === 'spotify' && (
                <FaSpotify className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
              )}
              {platform === 'youtube' && (
                <FaYoutube className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
              )}
            </div>
            {isError && <p className="text-red-400 text-sm">{state.message}</p>}
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
            <button
              onClick={handleSubmit}
              disabled={!url.trim() || !platform}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed "
            >
              Importar
            </button>
          </>
        )}

        {isRunning && (
          <div className="flex flex-col gap-y-4">
            <p className="text-neutral-300 text-sm">{state.message}</p>
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
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ImportPlaylistModal;