import { createClient } from '@/utils/supabase/client';
import React, { useState, useEffect } from "react";

const supabase = createClient();

interface ButtonUploadOrChangeProps {
  hasAvatar: boolean;
  onImageUpdate: (newImageUrl: string) => void;
}

const ButtonUploadOrChange: React.FC<ButtonUploadOrChangeProps> = ({ hasAvatar, onImageUpdate }) => {
  const [isMounted, setIsMounted] = useState(false);

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
  };

  const uploadUserImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const sanitizedFileName = sanitizeFileName(file.name);
    const filePath = `avatars/${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.log("Erro ao fazer upload da imagem:", uploadError);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

    if (!urlData) {
      console.error("Erro ao obter URL pública da imagem");
      return;
    }

    const newImageUrl = urlData.publicUrl;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    const { error: insertError } = await supabase
      .from("users")
      .upsert([{
        id: user.id,
        email: user.email,
        avatar_url: newImageUrl,
      }]);

    if (insertError) {
      console.log("Erro ao inserir o avatar no banco de dados:", insertError);
      return;
    }

    if (typeof onImageUpdate === "function") {
      onImageUpdate(newImageUrl);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

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