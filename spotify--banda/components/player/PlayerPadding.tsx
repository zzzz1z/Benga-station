'use client';

import usePlayer from '@/hooks/usePlayer';

export default function PlayerPadding({ children }: { children: React.ReactNode }) {
  const activeID = usePlayer(s => s.activeID);
  return (
    <div className={activeID ? 'pb-[120px] md:pb-[100px]' : ''}>
      {children}
    </div>
  );
}