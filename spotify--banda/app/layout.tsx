

import { Figtree } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/SideBar";
import SupabaseProvider from "@/providers/supabaseProviders";
import UserProvider from "@/providers/userProvider";
import ModalProvider from "@/providers/ModalProvider";
import ToasterProvider from "@/hooks/ToasterProvider";
import getSongsByUserId from "@/actions/getSongsByUserId";
import Player from "@/components/Player";
import getPlaylistsByUserId from "@/actions/getPlaylistsByUserId";
const font = Figtree({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: 'bengaXtation',
  description: 'A Progressive Web App for Benga Station',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};
// Additional component or app logic goes here.

async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const userSongs = await getSongsByUserId();
  const userPlaylists = await getPlaylistsByUserId();

  return (
  <html lang="pt-PT">
    <head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
    </head>
      <body>
        <ToasterProvider/>
        <SupabaseProvider>
          <UserProvider>
            <ModalProvider/>
            <SideBar playlist={userPlaylists} songs={userSongs}>
            {children}
            </SideBar>
            <Player/>   
        </UserProvider>
        </SupabaseProvider>     
      </body>
  </html>
  );
}

export default RootLayout