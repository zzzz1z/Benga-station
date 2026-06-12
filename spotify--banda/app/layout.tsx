import './globals.css';
import ToasterProvider from '@/hooks/ToasterProvider';
import ModalProvider from '@/providers/ModalProvider';
import UserProvider from '@/providers/userProvider';
import SideBar from '@/components/SideBar';
import { SessionProvider } from '@/providers/SessionContext';
import FloatingRefreshButton from '@/components/FloatingRefreshButton';
import { PlaylistProvider } from '@/hooks/usePlaylists';
import { LikedSongsProvider } from '@/hooks/useLikedSongs';
import { RefreshProvider } from '@/hooks/useRefresh';
import { PageTransitionProvider } from '@/providers/PageTransitionProvider';
import KeepAlive from '@/components/KeepAlive';
import AccessGuard from '@/components/AcessGuard';
import Player from '@/components/player/Player';
import PlayerPadding from '@/components/player/PlayerPadding';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <ToasterProvider />
        <AccessGuard />
        <UserProvider>
          <KeepAlive />
          <PageTransitionProvider>
            <SessionProvider>
              <RefreshProvider>
                <PlaylistProvider>
                  <LikedSongsProvider>
                    <ModalProvider />
                    <SideBar>
                    <PlayerPadding>
                      {children}
                    </PlayerPadding>
                    </SideBar>
                    <Player />
                    <FloatingRefreshButton />
                  </LikedSongsProvider>
                </PlaylistProvider>
              </RefreshProvider>
            </SessionProvider>
          </PageTransitionProvider>
        </UserProvider>
      </body>
    </html>
  );
}