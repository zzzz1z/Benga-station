'use client';

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import AddNewSongs from "@/app/playlists/components/AddNewSongs";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { BsImageFill } from "react-icons/bs";
import Modal from "@/components/Modal";

const supabase = createClient();
const SLASH = 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)';

const PlaylistModal: React.FC = () => {
  const playlistModal = usePlaylistModal();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPlaylistId('');
    setIsCreating(false);
    setImage(null);
    setImagePreview(null);
    playlistModal.onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!user?.id) return toast.error('Não autenticado.');
    if (!title.trim()) return toast.error('Título obrigatório.');

    setIsCreating(true);
    try {
      let publicURL = '';

      if (image) {
        const fileName = `${Date.now()}${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('playlist-covers')
          .upload(fileName, image);
        if (uploadError) throw new Error('Erro ao fazer upload da imagem.');
        const { data: urlData } = supabase.storage
          .from('playlist-covers')
          .getPublicUrl(uploadData.path);
        publicURL = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('Playlists')
        .insert([{ title, description, user_id: user.id, cover_image: publicURL }])
        .select()
        .single();

      if (error) throw new Error('Erro ao criar playlist.');

      toast.success('Playlist criada!');
      setPlaylistId(data.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      title="NOVA_PLAYLIST"
      description=""
      isOpen={playlistModal.isOpen}
      onChange={handleClose}
    >
      {!playlistId ? (
        <div className="flex flex-col gap-y-4 px-1">

          {/* Image upload */}
          <label className="relative flex flex-col items-center justify-center h-28 border border-dashed border-red-900/40 bg-red-500/5 cursor-pointer transition active:bg-red-500/10 overflow-hidden"
            style={{ clipPath: SLASH }}>
            {imagePreview
              ? <img src={imagePreview} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              : <>
                  <BsImageFill size={20} className="text-red-900/40 mb-2" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-red-900/40">COVER_IMAGE</span>
                </>
            }
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          {/* Title */}
          <input
            type="text"
            placeholder="PLAYLIST_TITLE..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-neutral-900 border border-red-900/30 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-2.5 placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50"
            style={{ clipPath: SLASH }}
          />

          {/* Description */}
          <input
            type="text"
            placeholder="DESCRIPTION... (opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-neutral-900 border border-red-900/30 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-2.5 placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50"
            style={{ clipPath: SLASH }}
          />

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={isCreating || !title.trim()}
            className="w-full py-3 text-[10px] font-mono uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#f87171',
              clipPath: SLASH,
            }}
          >
            {isCreating
              ? <span className="flex items-center justify-center gap-x-2">
                  <span className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
                  A_CRIAR...
                </span>
              : 'CRIAR_PLAYLIST'
            }
          </button>
        </div>
      ) : (
        /* After creation — AddNewSongs has both DB + YT tabs built in */
<AddNewSongs playlistId={playlistId} refreshPlaylist={handleClose} inlineOpen />
      )}
    </Modal>
  );
};

export default PlaylistModal;