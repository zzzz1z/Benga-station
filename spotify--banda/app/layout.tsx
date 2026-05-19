import { Figtree } from 'next/font/google';
import './globals.css';
import Player from '@/components/Player';
import GlobalWarmer from '@/components/GlobalWarmer';
import ToasterProvider from '@/hooks/ToasterProvider';
import ModalProvider from '@/providers/ModalProvider';
import UserProvider from '@/providers/userProvider';
import SideBar from '@/components/SideBar';
import { SessionProvider } from '@/providers/SessionContext';
import FloatingRefreshButton from '@/components/FloatingRefreshButton';
import { PlaylistProvider } from '@/hooks/usePlaylists';
import { RefreshProvider } from '@/hooks/useRefresh';
import { PageTransitionProvider } from '@/providers/PageTransitionProvider';

const font = Figtree({ subsets: ['latin'] });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <ToasterProvider />
        <UserProvider>
          <PageTransitionProvider>
            <SessionProvider>
              <RefreshProvider>
                <GlobalWarmer />
                <PlaylistProvider>
                  <ModalProvider />
                  
                  <SideBar>
                    {children}
                  </SideBar>
                  <Player />
                  <FloatingRefreshButton />
                </PlaylistProvider>
              </RefreshProvider>
            </SessionProvider>
          </PageTransitionProvider>
        </UserProvider>
      </body>
    </html>
  );
}