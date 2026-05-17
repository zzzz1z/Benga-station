"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HiHome } from "react-icons/hi";
import { BiSearch } from "react-icons/bi";
import { FcLike } from "react-icons/fc";
import { SlPlaylist } from "react-icons/sl";
import { MdWifiOff } from "react-icons/md";
import { useUser } from "@/hooks/useUser";
import usePlayer from "@/hooks/usePlayer";
import Box from "./Box";
import SideBarItem from "./SideBarItem";
import Biblioteca from "./Biblioteca";
import { twMerge } from "tailwind-merge";

interface SidebarProps {
  children: React.ReactNode;
}

const SideBar: React.FC<SidebarProps> = ({ children }) => {
  const { user } = useUser();
  const pathname = usePathname();
  const player = usePlayer();

  const routes = useMemo(
    () => [
      { icon: HiHome,     label: "Casa",              active: pathname === "/",          href: "/" },
      { icon: BiSearch,   label: "Pesquisar",         active: pathname === "/search",    href: "/search" },
      { icon: SlPlaylist, label: "Playlists",         active: pathname === "/playlists", href: "/playlists" },
      { icon: FcLike,     label: "Músicas Favoritas", active: pathname === "/liked",     href: "/liked" },
      ...(user ? [
        { icon: MdWifiOff, label: "Offline", active: pathname === "/offline", href: "/offline" },
      ] : []),
    ],
    [pathname, user]
  );

  return (
    <div className={twMerge(`flex h-full`, player.activeID && "h-[calc(100%-80px)]")}>
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2">
        <Box className="flex flex-col gap-y-4 px-5 py-4">
          {routes.map((item) => (
            <SideBarItem key={item.label} {...item} />
          ))}
        </Box>
        <Box className="overflow-y-auto h-full">
          <Biblioteca />
        </Box>
      </div>
      <main className="h-full flex-1 overflow-y-auto py-2">{children}</main>
    </div>
  );
};

export default SideBar;