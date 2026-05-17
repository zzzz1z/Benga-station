"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import useAuthModal from "@/hooks/useAuthModal";
import useUploadModal from "@/hooks/useUploadModal";
import { useUser } from "@/hooks/useUser";
import { Playlist } from "@/types";
import { AiOutlinePlus } from "react-icons/ai";
import { TbPlaylist } from "react-icons/tb";
import PlaylistItem from "@/app/playlists/components/PlaylistsItem";

const supabase = createClient();

const Biblioteca = () => {
  const authModal = useAuthModal();
  const uploadModal = useUploadModal();
  const { user, userDetails } = useUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const fetchPlaylists = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("Playlists")
      .select("*, playlist_songs(Songs(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) return;

    setPlaylists(
      data.map((playlist: any) => ({
        ...playlist,
        songs: (playlist.playlist_songs ?? [])
          .map((ps: any) => ps.Songs)
          .filter(Boolean),
      }))
    );
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Realtime — watch for any change to this user's playlists
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`biblioteca-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Playlists",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchPlaylists()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchPlaylists]);

  const onClick = () => {
    if (!user) return authModal.onOpen("sign_up");
    return uploadModal.onOpen();
  };

  return (
    <div className="flex flex-col">
      {userDetails?.role === "admin" && (
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="inline-flex items-center gap-x-2">
            <TbPlaylist className="text-neutral-400" size={26} />
            <p className="text-neutral-400 font-medium text-md">Adicionar música</p>
          </div>
          <AiOutlinePlus
            onClick={onClick}
            size={20}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
        </div>
      )}

      <div className="flex flex-col gap-y-2 mt-4 px-3">
        {playlists.map((item: Playlist) => (
          <PlaylistItem key={item.id} data={item} />
        ))}
      </div>
    </div>
  );
};

export default Biblioteca;