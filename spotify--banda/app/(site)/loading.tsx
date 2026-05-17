const SongCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="flex flex-col gap-y-3 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="relative w-full aspect-square bg-neutral-800"
      style={{ clipPath: 'polygon(0 0, 92% 0, 100% 8%, 100% 100%, 8% 100%, 0 92%)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent" />
    </div>
    <div className="h-3 bg-neutral-800 rounded w-3/4" />
    <div className="h-2 bg-neutral-800 rounded w-1/2" />
  </div>
);

const SectionSkeleton = ({ count = 8, label }: { count?: number; label: string }) => (
  <div className="flex flex-col gap-y-4">
    <div className="flex items-center gap-x-3">
      <div className="w-5 h-5 bg-red-900/40 rounded animate-pulse" />
      <div className="h-5 bg-neutral-800 rounded w-40 animate-pulse" />
      <div className="h-px flex-1 bg-gradient-to-r from-red-900/30 to-transparent" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SongCardSkeleton key={i} delay={i * 40} />
      ))}
    </div>
  </div>
);

export default function HomeLoading() {
  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto pt-[30px] pb-24 relative">
      {/* Header skeleton */}
      <div className="px-6 pt-8 pb-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-x-3 mb-6">
          <div className="h-8 w-1 bg-red-600/50" />
          <div className="h-8 bg-neutral-800 rounded w-52 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="h-16 bg-neutral-800/60 rounded animate-pulse border border-neutral-700/30"
              style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-6 mt-8 space-y-12">
        <SectionSkeleton label="Hot Streak" count={8} />
        <SectionSkeleton label="Novas Frequências" count={8} />
        <SectionSkeleton label="Base de Dados" count={8} />
      </div>

      {/* HUD corner */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-y-1 pointer-events-none">
        <div className="flex items-center gap-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-mono text-red-500/40 uppercase tracking-widest">Carregando sistema</span>
        </div>
        <div className="h-px w-24 bg-gradient-to-l from-red-500/30 to-transparent" />
      </div>
    </div>
  );
}