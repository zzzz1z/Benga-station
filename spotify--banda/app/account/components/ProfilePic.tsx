'use client';

import React, { useState } from "react";
import ButtonUploadOrChange from "./ButtonUploadOrChange";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";

const ProfilePic = () => {
  const { user, userDetails } = useUser();
  const [imageUrl, setImageUrl] = useState<string | null>(userDetails?.avatar_url ?? null);

  const handleImageUpdate = (newImageUrl: string) => setImageUrl(newImageUrl);

  return (
    <div className="flex flex-col items-center gap-y-3">
      <div className="relative flex-shrink-0">
        <div
          className="absolute inset-0 rounded-full blur-md opacity-60 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5), transparent 70%)' }}
        />
        <div
          className="absolute -inset-1 rounded-full animate-spin pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, rgba(239,68,68,0.6), transparent 60%, rgba(239,68,68,0.6))',
            animationDuration: '6s',
          }}
        />
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
        </div>
        <span
          className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-neutral-900"
          style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
        />
      </div>
      <ButtonUploadOrChange
        hasAvatar={!!imageUrl}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
};

export default ProfilePic;