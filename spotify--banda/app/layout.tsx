import { Figtree } from 'next/font/google';
import './globals.css';
import Player from '@/components/Player';
import GlobalWarmer from '@/components/GlobalWarmer';
import ToasterProvider from '@/hooks/ToasterProvider';
import ModalProvider from '@/providers/ModalProvider';
import UserProvider from '@/providers/userProvider';
import SideBar from '@/components/SideBar';
import { PageTransitionProvider } from '@/hooks/PageTransitionProvider';

const font = Figtree({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className}>
        <ToasterProvider />
        <UserProvider>
          <PageTransitionProvider>
            <ModalProvider />
            <GlobalWarmer />
            <SideBar>
              {children}
            </SideBar>
            <Player />
          </PageTransitionProvider>
        </UserProvider>
      </body>
    </html>
  );
}