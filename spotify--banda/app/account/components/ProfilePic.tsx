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

    if (data?.avatar_url) setImageUrl(data.avatar_url);
  };

  const handleImageUpdate = (newImageUrl: string) => setImageUrl(newImageUrl);

  useEffect(() => { fetchUserImage(); }, []);

  return (
    <div className="flex flex-col items-center gap-y-3">

      {/* Avatar ring + glow */}
      <div className="relative flex-shrink-0">

        {/* Outer red glow */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-60 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5), transparent 70%)' }}
        />

        {/* Spinning dashed ring */}
        <div
          className="absolute -inset-1 rounded-full animate-spin pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, rgba(239,68,68,0.6), transparent 60%, rgba(239,68,68,0.6))',
            animationDuration: '6s',
          }}
        />

        {/* Avatar circle */}
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            background: 'rgba(30,10,10,0.9)',
            border: '2px solid rgba(239,68,68,0.5)',
            boxShadow: '0 0 16px rgba(239,68,68,0.3), inset 0 0 12px rgba(0,0,0,0.6)',
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Profile"
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(239,68,68,0.5)' }}
            >
              N/A
            </span>
          )}

             {/* Online indicator */}
                        <span
                            className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-neutral-900"
                            style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
                        />
        </div>
        

      </div>

      {/* Upload button */}
      <ButtonUploadOrChange
        hasAvatar={!!imageUrl}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
};

export default ProfilePic;