import { createClient } from '@/utils/supabase/client';
import React, { useEffect, useState } from "react";
import ButtonUploadOrChange from "./ButtonUploadOrChange";

const supabase = createClient();

const ProfilePic = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fetchUserImage = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("users")
      .select("avatar_url")
      .eq('id', user?.id)
      .single();

    if (error) {
      console.log("Erro ao buscar imagem:", error);
      return;
    }

    if (data?.avatar_url) {
      setImageUrl(data.avatar_url);
    }
  };

  const handleImageUpdate = (newImageUrl: string) => {
    setImageUrl(newImageUrl);
  };

  useEffect(() => {
    fetchUserImage();
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="Profile" className="w-28 h-28" />
          <ButtonUploadOrChange hasAvatar={true} onImageUpdate={handleImageUpdate} />
        </>
      ) : (
        <>
          <div className="w-34 h-34 bg-gray-300 rounded-full flex items-center justify-center">
            <span>Sem Foto</span>
          </div>
          <ButtonUploadOrChange hasAvatar={false} onImageUpdate={handleImageUpdate} />
        </>
      )}
    </div>
  );
};

export default ProfilePic;