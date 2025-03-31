import { useSupabaseClient } from "@supabase/auth-helpers-react";
import React, { useEffect, useState } from "react";
import ButtonUploadOrChange from "./ButtonUploadOrChange";

const ProfilePic = () => {
  const supabase = useSupabaseClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Fetch user's profile picture
  const fetchUserImage = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("avatar_url")
      .single();

    if (error) {
      console.log("Erro ao buscar imagem:", error);
      return;
    }

    if (data?.avatar_url) {
      setImageUrl(data.avatar_url);
    }
  };

  // Callback function to update the avatar after upload
  const handleImageUpdate = (newImageUrl: string) => {
    console.log("Updating avatar to:", newImageUrl); // Debugging log
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
