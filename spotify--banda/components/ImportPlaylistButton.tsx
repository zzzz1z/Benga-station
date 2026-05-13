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
        className="flex items-center gap-x-2 mt-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition active:scale-95 w-fit"
      >
        <FiDownload size={15} />
        Importar Playlist
      </button>

      <ImportPlaylistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default ImportPlaylistButton;