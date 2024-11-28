'use client';

import Modal from "./Modal";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import AddSongToPlaylistModal from "@/app/pages/playlists/[id]/AddSongsToPlaylist";
import Button from "./Botão";

const PlaylistModal: React.FC = () => {
  const playlistModal = usePlaylistModal();
  const supabaseClient = useSupabaseClient();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
      // Insert playlist into the database
      const { data, error } = await supabaseClient
        .from('Playlists')
        .insert([{ title, description, user_id: user?.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Set the playlist ID for song addition
      setPlaylistId(data.id);

      alert("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseModal = () => {
    setTitle('');
    setDescription('');
    setPlaylistId(null);
    playlistModal.onClose();
  };

  return (
    <Modal
      title="Create a New Playlist 📝"
      description="Choose songs and create your personalized playlist! 🎶"
      isOpen={playlistModal.isOpen}
      onChange={(open) => !open && handleCloseModal()}
    >
      <form className="flex flex-col gap-4">
        {/* Playlist Title */}
        <input
          className="border p-2 rounded"
          required
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Playlist Description */}
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Song Selection */}
        {playlistId ? (
          <AddSongToPlaylistModal playlistId={playlistId} />
        ) : (
          <p className="text-gray-500">Create the playlist to add songs.</p>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleCreatePlaylist}
          disabled={isCreating || !!playlistId} // Disable if creating or already created
        >
          {isCreating ? "Creating..." : "Create Playlist"}
        </Button>
      </form>
    </Modal>
  );
};

export default PlaylistModal;
