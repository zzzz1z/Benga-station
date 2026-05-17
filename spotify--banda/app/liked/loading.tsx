const SkeletonRow = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="flex items-center gap-x-3 px-2 py-2 animate-pulse border-b border-white/5"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-10 h-10 flex-shrink-0 bg-neutral-800"
      style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }} />
    <div className="flex flex-col gap-y-1.5 flex-1">
      <div className="h-3 bg-neutral-800 rounded w-2/3" />
      <div className="h-2 bg-neutral-800 rounded w-1/3" />
    </div>
    <div className="w-6 h-6 bg-neutral-800 rounded flex-shrink-0" />
  </div>
);

export default function LikedLoading() {
  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto pt-[30px]">
      {/* Header skeleton */}
      <div className="px-6 pt-8 pb-8 border-b border-neutral-800/50">
        <div className="flex flex-col md:flex-row items-center gap-x-5 gap-y-4">
          <div className="relative h-32 w-32 lg:h-44 lg:w-44 flex-shrink-0 bg-neutral-800 animate-pulse"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent" />
          </div>
          <div className="flex flex-col gap-y-3 items-center md:items-start w-full">
            <div className="h-3 bg-neutral-800 rounded w-20 animate-pulse" />
            <div className="h-12 bg-neutral-800 rounded w-64 animate-pulse" />
            <div className="h-3 bg-neutral-800 rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Song list skeleton */}
      <div className="px-6 py-4 flex flex-col">
        {/* Play button row */}
        <div className="flex items-center gap-x-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-600/20 animate-pulse border border-red-600/30" />
          <div className="h-3 bg-neutral-800 rounded w-24 animate-pulse" />
        </div>

        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonRow key={i} delay={i * 35} />
        ))}
      </div>

      {/* HUD corner */}
      <div className="fixed top-8 right-6 flex items-center gap-x-1.5 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[9px] font-mono text-red-500/40 uppercase tracking-widest">Sincronizando</span>
      </div>
    </div>
  );
}