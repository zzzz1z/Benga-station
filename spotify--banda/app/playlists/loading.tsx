const PlaylistRowSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="flex items-center gap-x-4 w-full p-3 border border-neutral-800/50 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="relative h-12 w-12 flex-shrink-0 bg-neutral-800"
      style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/15 to-transparent" />
    </div>
    <div className="flex flex-col gap-y-1.5 flex-1 min-w-0">
      <div className="h-3 bg-neutral-800 rounded w-3/5" />
      <div className="h-2 bg-neutral-800 rounded w-2/5" />
    </div>
    <div className="w-4 h-4 bg-neutral-800 rounded flex-shrink-0" />
  </div>
);

export default function PlaylistsLoading() {
  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto pt-[30px]">
      {/* Header skeleton */}
      <div className="px-6 pt-8 pb-8 border-b border-neutral-800/50">
        <div className="flex flex-col md:flex-row items-center gap-x-5 gap-y-4">
          <div className="relative h-32 w-32 lg:h-44 lg:w-44 flex-shrink-0 bg-neutral-800 animate-pulse"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent" />
          </div>
          <div className="flex flex-col gap-y-3 items-center md:items-start">
            <div className="h-3 bg-neutral-800 rounded w-20 animate-pulse" />
            <div className="h-14 bg-neutral-800 rounded w-56 animate-pulse" />
            <div className="h-9 bg-red-900/20 border border-red-900/30 rounded w-40 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Playlist list */}
      <div className="p-6 flex flex-col gap-y-2">
        {/* Create button skeleton */}
        <div className="h-10 bg-red-600/10 border border-red-600/20 rounded animate-pulse mb-2" />

        {Array.from({ length: 8 }).map((_, i) => (
          <PlaylistRowSkeleton key={i} delay={i * 50} />
        ))}
      </div>

      {/* HUD corner */}
      <div className="fixed top-8 right-6 flex items-center gap-x-1.5 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[9px] font-mono text-red-500/40 uppercase tracking-widest">A carregar biblioteca</span>
      </div>
    </div>
  );
}