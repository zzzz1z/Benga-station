'use client';

import PlaylistDetails from '../components/PlaylistDetails';
import Header from '@/components/Header';

const PlaylistPage = () => {
  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto safe-top pt-[30px] pb-24 relative">

      <Header />
      <PlaylistDetails />
    </div>
  );
};

export default PlaylistPage;