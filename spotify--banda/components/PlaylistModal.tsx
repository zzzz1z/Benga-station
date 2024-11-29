'use client';

import Modal from "./Modal";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";

import usePlaylistModal from "@/hooks/usePlaylistModal";
import AddSongToPlaylistModal from "@/app/playlists/components/AddSongsToPlaylist";
import Button from "./Botão";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const PlaylistModal: React.FC = () => {
  const playlistModal = usePlaylistModal();
  const supabaseClient = useSupabaseClient();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [image, setImage] = useState<File | null>(null); // State for the uploaded image
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Store the image URL

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
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
      let imagePath = '';
      let publicURL = '';
  
      // If an image is uploaded, upload it to Supabase Storage
      if (image) {
        const fileName = `${Date.now()}-${image.name}`;
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('playlist-covers')
          .upload(fileName, image);
  
        if (uploadError) {
          console.error("Error uploading image:", uploadError.message);
          throw new Error("Failed to upload image.");
        }
  
        imagePath = uploadData?.path || '';
        console.log("Image uploaded successfully:", imagePath);
  
        // Retrieve the public URL of the uploaded image
        const { data: urlData} = supabaseClient.storage
          .from('playlist-covers')
          .getPublicUrl(imagePath);
  
       
        publicURL = urlData.publicUrl || '';
        console.log("Public URL retrieved:", publicURL);
  
        setImageUrl(publicURL); // Store the public URL for preview
      }
  
      // Insert playlist into the database
      const { data: playlistData, error: playlistError } = await supabaseClient
        .from('Playlists')
        .insert([{ 
          title, 
          description, 
          user_id: user?.id, 
          cover_image: publicURL // Pass the retrieved public URL
        }])
        .select()
        .single();
  
      if (playlistError) {
        console.error("Error inserting playlist:", playlistError.message);
        throw new Error("Failed to create playlist.");
      }
  
      console.log("Playlist created successfully:", playlistData);
  
      // Set the playlist ID for song addition
      setPlaylistId(playlistData.id);
  
      alert("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsCreating(false);
    }
  };
  

  const handleCloseModal = () => {
    setTitle('');
    setDescription('');
    setPlaylistId(null);
    setImage(null); // Reset image state
    setImageUrl(null); // Reset image URL state
    playlistModal.onClose();
  };

  return (
    <Modal
      description="Para adicionar músicas, primeiro crie uma playlist "
      title="Criar nova lista de reprodução"
      isOpen={playlistModal.isOpen}
      onChange={(open) => !open && handleCloseModal()}
    >
      <form className="flex flex-col">
      
      
      
        {/* Playlist Cover Preview */}
        {imageUrl && (
          <div className="mt-4">
            <img src={imageUrl} alt="Playlist Cover" className="w-32 h-32 object-cover rounded" />
          </div>
        )}



        {/* Image Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 rounded"
        />
        {image && <p>Selected image: {image.name}</p>}

        

        {/* Playlist Title */}
        <input
          className="border p-2 rounded"
          required
          type="text"
          placeholder="título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Playlist Description */}
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="sinopse (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        /> 
        
        
        {/* Submit Button */}
        <Button
          onClick={handleCreatePlaylist}
          disabled={isCreating || !!playlistId} // Disable if creating or already created
        >
          {isCreating ? "Criando" : "Feito!"}
        </Button>

        
        {/* Song Selection */}
        {playlistId ? (
          <AddSongToPlaylistModal playlistId={playlistId} />
        ) : (
          <p className="text-gray-700"></p>
        )}

       
      </form>
    </Modal>
  );
};

export default PlaylistModal;
