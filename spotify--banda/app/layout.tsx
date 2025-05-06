

import { Figtree } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/SideBar";
import SupabaseProvider from "@/providers/supabaseProviders";
import UserProvider from "@/providers/userProvider";
import ModalProvider from "@/providers/ModalProvider";
import ToasterProvider from "@/hooks/ToasterProvider";
import Player from "@/components/Player";
const font = Figtree({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: 'bengaXtation',
  description: 'A Progressive Web App for Benga Station',
  icons: {
    icon: '/icons/favicon-96x96.png',
    apple: '/icons/apple-touch-icon.png',
  },
};
// Additional component or app logic goes here.

async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
  <html lang="pt-PT">
    <head>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />
      <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" href="/icons/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
      <meta name="BengaXtation" content="MyWebSited" />
      <link rel="manifest" href="/site.webmanifest" />



      <link rel="shortcut icon" href="/icons/favicon.ico" />

      </head>
      <body>
        <ToasterProvider/>
        <SupabaseProvider>
          <UserProvider>
            <ModalProvider/>
            <SideBar>
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