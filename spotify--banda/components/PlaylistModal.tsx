'use client';

import Modal from "./Modal";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import AddSongToPlaylistModal from "@/app/playlists/components/AddSongsToPlaylist";
import Button from "./Botão";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const PlaylistModal: React.FC = () => {
  const playlistModal = usePlaylistModal();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImage(e.target.files[0]);
  };

  const handleCreatePlaylist = async () => {
    if (!user?.id) {
      alert("You must be logged in to create a playlist.");
      return;
    }

    if (!title.trim()) {
      alert("Title is required.");
      return;
    }

    setIsCreating(true);

    try {
      let publicURL = '';

      if (image) {
        const fileName = `${Date.now()}${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('playlist-covers')
          .upload(fileName, image);

        if (uploadError) throw new Error("Failed to upload image.");

        const { data: urlData } = supabase.storage
          .from('playlist-covers')
          .getPublicUrl(uploadData?.path ?? '');

        publicURL = urlData.publicUrl ?? '';
        setImageUrl(publicURL);
      }

      const { data: playlistData, error: playlistError } = await supabase
        .from('Playlists')
        .insert([{ title, description, user_id: user?.id, cover_image: publicURL }])
        .select()
        .single();

      if (playlistError) throw new Error("Failed to create playlist.");

      setPlaylistId(playlistData.id);
      alert("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      description="Para adicionar músicas, primeiro crie uma playlist"
      title="Criar nova lista de reprodução"
      isOpen={playlistModal.isOpen}
      onChange={playlistModal.onClose}
    >
      <div className="flex m-auto flex-col w-50 items-center gap-4">
        {imageUrl && (
          <div className="mt-4">
            <img src={imageUrl} alt="Playlist Cover" className="w-32 h-32 object-cover rounded" />
          </div>
        )}

        <input type="file" accept="image/*" onChange={handleImageChange} className="border p-2 rounded w-full" />

        <input
          className="w-full border p-2 rounded"
          required
          type="text"
          placeholder="título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 rounded w-full"
          type="text"
          placeholder="sinopse (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {playlistId ? (
          <AddSongToPlaylistModal playlistId={playlistId} />
        ) : (
          <>
            <Button onClick={handleCreatePlaylist} disabled={isCreating ?? !!playlistId}>
              {isCreating ? "Criando" : "Feito!"}
            </Button>
            <p className="text-gray-700">esqueci</p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PlaylistModal;