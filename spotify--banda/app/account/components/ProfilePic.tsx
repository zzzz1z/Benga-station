'use client';

import { createClient } from '@/utils/supabase/client';
import React, { useEffect, useState } from "react";
import ButtonUploadOrChange from "./ButtonUploadOrChange";
import Image from "next/image";

const ProfilePic = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fetchUserImage = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("avatar_url")
      .eq('id', user.id)
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
    <div className="flex flex-col items-center gap-y-4">
      <div className="relative w-40 h-40 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Profile"
            fill
            className="object-cover"
            sizes="160px"
            unoptimized
          />
        ) : (
          <span className="text-neutral-400 text-sm">Sem Foto</span>
        )}
      </div>
      <ButtonUploadOrChange
        hasAvatar={!!imageUrl}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
};

export default ProfilePic;