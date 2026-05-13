'use client';

import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import ImportPlaylistModal from './ImportPlaylistModal';

const ImportPlaylistButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative flex items-center gap-x-2 mt-2 px-5 py-2.5 w-fit text-sm font-bold tracking-widest uppercase overflow-hidden transition-all duration-200 active:scale-95"
        style={{
          background: 'transparent',
          border: '1px solid rgba(239,68,68,0.6)',
          color: '#fff',
          clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
        }}
      >
        {/* Animated red glow fill on hover */}
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(90deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.08) 100%)',
          }}
        />

        {/* Scan line sweep */}
        <span
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }}
        />

        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-red-500 opacity-80" />
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-red-500 opacity-80" />

        <FiDownload
          size={14}
          className="relative z-10 text-red-400 group-hover:text-red-300 transition-colors"
        />
        <span className="relative z-10 text-neutral-200 group-hover:text-white transition-colors">
          Importar Playlist
        </span>
      </button>

      <ImportPlaylistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default ImportPlaylistButton;