'use client';

import Header from "@/components/Header";
import LikedContent from "./components/LikedContent";
import Image from "next/image";

const Liked = () => {
  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header>
        <div className="mt-6 mb-2">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-x-6 gap-y-4">
            <div className="relative flex-shrink-0 h-32 w-32 lg:h-44 lg:w-44">
              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-red-500 z-10" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-red-500 z-10" />
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-red-500 z-10" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-red-500 z-10" />
              <div className="absolute inset-0 blur-xl opacity-30 pointer-events-none z-0"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.8), transparent 70%)' }} />
              <Image
                fill priority
                sizes="(max-width: 768px) 128px, 176px"
                alt="Músicas Favoritas"
                className="object-cover relative z-[1]"
                src="/images/likedit.png"
              />
            </div>
            <div className="flex flex-col gap-y-2 items-center md:items-start">
              <p className="text-red-500/60 font-mono text-[9px] uppercase tracking-[0.3em]">
                ▶ BIBLIOTECA // FAVORITAS
              </p>
              <h1
                className="text-white text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-center md:text-left"
                style={{ textShadow: '0 0 40px rgba(239,68,68,0.25)' }}
              >
                Músicas<br className="md:hidden" /> Favoritas
              </h1>
            </div>
          </div>
        </div>
      </Header>
      <LikedContent />
    </div>
  );
};

export default Liked;