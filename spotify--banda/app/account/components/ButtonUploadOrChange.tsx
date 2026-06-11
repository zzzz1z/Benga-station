'use client';

import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/hooks/useUser';
import { authedFetch } from '@/utils/api';
import React, { useRef } from "react";

const supabase = createClient();

interface ButtonUploadOrChangeProps {
  hasAvatar: boolean;
  onImageUpdate: (newImageUrl: string) => void;
}

const ButtonUploadOrChange: React.FC<ButtonUploadOrChangeProps> = ({ hasAvatar, onImageUpdate }) => {
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const sanitizeFileName = (fileName: string) =>
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();

  const uploadUserImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const sanitizedFileName = sanitizeFileName(file.name);
    const filePath = `avatars/${user.id}_${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Erro ao fazer upload da imagem:", uploadError);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) return;

    // use authedFetch to update avatar_url via VPS instead of direct Supabase call
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
      method: 'PATCH',
      body: JSON.stringify({ avatar_url: urlData.publicUrl }),
    });

    if (!res.ok) {
      console.error("Erro ao atualizar avatar");
      return;
    }

    onImageUpdate(urlData.publicUrl);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <label
      className="cursor-pointer relative flex items-center gap-x-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
      style={{
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.35)',
        color: '#f87171',
        clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
        boxShadow: '0 0 10px rgba(239,68,68,0.1)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(239,68,68,0.25)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(239,68,68,0.1)';
      }}
    >
      {hasAvatar ? '⟳  Trocar Foto' : '↑  Enviar Foto'}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={uploadUserImage}
        className="hidden"
      />
    </label>
  );
};

export default ButtonUploadOrChange;