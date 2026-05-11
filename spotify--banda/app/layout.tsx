import "./globals.css";
import SideBar from "@/components/SideBar";
import ModalProvider from "@/providers/ModalProvider";
import ToasterProvider from "@/hooks/ToasterProvider";
import Player from "@/components/Player";
import UserProvider from "@/providers/userProvider";
import KeepAlive from "@/components/KeepAlive";

export const metadata = {
  title: 'bengaXtation',
  description: 'A Progressive Web App for Benga Station',
  icons: {
    icon: '/icons/favicon-96x96.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="h-full overflow-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/icons/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <meta name="BengaXtation" content="MyWebSited" />
        <link rel="shortcut icon" href="/icons/favicon.ico" />
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
            document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
            document.addEventListener('touchmove', function(e) {
              if (e.touches.length > 1) e.preventDefault();
            }, { passive: false });
          `
        }} />
      </head>
      <body className="h-full overflow-hidden">
        <ToasterProvider />
        <UserProvider>
          <KeepAlive />
          <ModalProvider />
          <div className="flex flex-col h-full overflow-hidden">
            <SideBar>
              {children}
            </SideBar>
          </div>
          <Player />
        </UserProvider>
      </body>
    </html>
  );
}

export default RootLayout;