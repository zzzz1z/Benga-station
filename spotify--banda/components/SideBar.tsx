
"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { BiSearch } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import Box from "./Box";
import SideBarItem from "./SideBarItem";
import Biblioteca from "./Biblioteca";
import { Playlist, Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import { twMerge } from "tailwind-merge";

interface sidebarProps{
    children: React.ReactNode;
    songs: Song[];
    playlist: Playlist[];
}
const SideBar: React.FC <sidebarProps> = ({
    children,
    songs,
    playlist
}) => {

    const pathname = usePathname();
    const player = usePlayer();


    const routes = useMemo(()=> [

        {
            icon: HiHome,
            label: 'Casa',
            active: pathname !== '/search',
            href: '/',
        },
        {
            icon: BiSearch,
            label: 'Pesquisar',
            active: pathname === '/search',
            href: '/search',
        }
    ], [pathname]);


  return (
    <div className={twMerge(`
        flex 
        h-full
        `,
        player.activeID && 'h-[calc(100%-80px)]'
        )}>

        <div
        className="
        hidden
        md:flex
        flex-col
        gap-y-2
        bg-black
        h-full
        w-[300px]
        p-2
        ">
         <Box className="
         flex
         flex-col
         gap-y4
         px-5
         py-4
         ">
            {routes.map((item) => (
                <SideBarItem
                key={item.label}{...item}/>
            ))}
           
         </Box>
         <Box className="overflow-y-auto h-full">
            <Biblioteca playlists={playlist} songs={songs}/>
         </Box>
        </div>
        <main className="h-full flex-1 overflow-y-auto py-2">
            {children}
        </main>

    </div>
  )
}

export default SideBar
