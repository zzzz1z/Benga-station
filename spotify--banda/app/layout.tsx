
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/SideBar";
import SupabaseProvider from "@/providers/supabaseProviders";
import UserProvider from "@/providers/userProvider";
import ModalProvider from "@/providers/ModalProvider";
import ToasterProvider from "@/hooks/ToasterProvider";
import getSongsByUserId from "@/actions/getSongsByUserId";
import Player from "@/components/Player";
import getActiveProductsWithPrices from "@/actions/getActiveProductsWithPrices";
import getPlaylistsByUserId from "@/actions/getPlaylistsByUserId";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
const font = Figtree({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Benga station",
  description: "Para ouvir música",
};

// Additional component or app logic goes here.

 async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const userSongs = await getSongsByUserId();
  const userPlaylists = await getPlaylistsByUserId();
  const products = await getActiveProductsWithPrices();

  return (
    <html>
      <body >
        <ToasterProvider/>
        <SupabaseProvider>

          <UserProvider>

            <ModalProvider products={products}/>

          
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