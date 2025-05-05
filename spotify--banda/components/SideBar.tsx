"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { usePathname } from "next/navigation";
import { HiHome } from "react-icons/hi";
import { BiSearch } from "react-icons/bi";
import { FcLike } from "react-icons/fc";
import { SlPlaylist } from "react-icons/sl";
import { Playlist, Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import Box from "./Box";
import SideBarItem from "./SideBarItem";
import Biblioteca from "./Biblioteca";
import { twMerge } from "tailwind-merge";

interface SidebarProps {
  children: React.ReactNode;
}

const SideBar: React.FC<SidebarProps> = ({ children }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const pathname = usePathname();
  const player = usePlayer();

  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const getSongsAndPlaylists = async () => {
      if (!user) return;

      const { data: songsData, error: songsError } = await supabase
        .from("Songs")
        .select("*")
        .eq("user_id", user.id);

      const { data: playlistsData, error: playlistsError } = await supabase
        .from("Playlists")
        .select("*")
        .eq("user_id", user.id);

      if (!songsError && songsData) setUserSongs(songsData);
      if (!playlistsError && playlistsData) setUserPlaylists(playlistsData);
    };

    getSongsAndPlaylists();
  }, [supabase, user]);

  const routes = useMemo(
    () => [
      {
        icon: HiHome,
        label: "Casa",
        active: pathname !== "/",
        href: "/",
      },
      {
        icon: BiSearch,
        label: "Pesquisar",
        active: pathname === "/search",
        href: "/search",
      },
      {
        icon: SlPlaylist,
        label: "Playlists",
        active: pathname === "/playlists",
        href: "/playlists",
      },
      {
        icon: FcLike,
        label: "Músicas Favoritas",
        active: pathname === "/liked",
        href: "/liked",
      },
    ],
    [pathname]
  );

  return (
    <div
      className={twMerge(
        `flex h-full`,
        player.activeID && "h-[calc(100%-80px)]"
      )}
    >
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2">
        <Box className="flex flex-col gap-y4 px-5 py-4">
          {routes.map((item) => (
            <SideBarItem key={item.label} {...item} />
          ))}
        </Box>
        <Box className="overflow-y-auto h-full">
          <Biblioteca playlists={userPlaylists} songs={userSongs} />
        </Box>
      </div>
      <main className="h-full flex-1 overflow-y-auto py-2">{children}</main>
    </div>
  );
};

export default SideBar;
