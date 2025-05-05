import { useSupabaseClient } from "@supabase/auth-helpers-react";
import React, { useState, useEffect } from "react";

interface ButtonUploadOrChangeProps {
  hasAvatar: boolean;
  onImageUpdate: (newImageUrl: string) => void;
}

const ButtonUploadOrChange: React.FC<ButtonUploadOrChangeProps> = ({ hasAvatar, onImageUpdate }) => {
  const supabase = useSupabaseClient();
  const [isMounted, setIsMounted] = useState(false);

  // Function to sanitize filenames (removes accents and spaces)
  const sanitizeFileName = (fileName: string) => {
    return fileName
      .normalize("NFD") // Normalize accents
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase(); // Convert to lowercase
  };

  // Upload function
  const uploadUserImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const sanitizedFileName = sanitizeFileName(file.name);
    const filePath = `avatars/${sanitizedFileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.log("Erro ao fazer upload da imagem:", uploadError);
      return;
    }

    // Get the public URL of the uploaded image
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

    if (!urlData) {
      console.error("Erro ao obter URL pública da imagem");
      return;
    }

    const newImageUrl = urlData.publicUrl;

    // Get the authenticated user
    const user = await supabase.auth.getUser();
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    const userId = user.data.user?.id; // Get the authenticated user's ID
    const userEmail = user.data.user?.email; // Get the authenticated user's email

    // Insert or update the avatar and email in the users table
    const { error: insertError } = await supabase
      .from("users")
      .upsert(
        [
          {
            id: userId, // Use the authenticated user's ID
            email: userEmail, // Include the email
            avatar_url: newImageUrl, // Update the avatar URL
          },
        ],
        
      );

    if (insertError) {
      console.log("Erro ao inserir o avatar no banco de dados:", insertError);
      return;
    }

    // Call the onImageUpdate function to update the image in ProfilePic component
    if (typeof onImageUpdate === "function") {
      onImageUpdate(newImageUrl);
    } else {
      console.error("onImageUpdate is not a function:", onImageUpdate);
    }
  };

  // Ensure this is only run on the client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
        {hasAvatar ? "Trocar Foto" : "Enviar Foto"}
        <input type="file" accept="image/*" onChange={uploadUserImage} className="hidden" />
      </label>
    </div>
  );
};

export default ButtonUploadOrChange;
