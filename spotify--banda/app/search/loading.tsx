const SearchRowSkeleton = ({ delay = 0, gold = false }: { delay?: number; gold?: boolean }) => (
  <div
    className="flex items-center gap-x-3 px-2 py-2 animate-pulse border-b border-white/5"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className="w-10 h-10 flex-shrink-0"
      style={{
        clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
        background: gold
          ? 'linear-gradient(135deg, #1a0a00, #2d1500)'
          : 'linear-gradient(135deg, #171717, #262626)',
        border: gold ? '1px solid rgba(255,140,0,0.2)' : '1px solid rgba(239,68,68,0.1)',
      }}
    />
    <div className="flex flex-col gap-y-1.5 flex-1">
      <div className="h-3 rounded w-2/3"
        style={{ background: gold ? 'rgba(255,140,0,0.1)' : 'rgb(38,38,38)' }} />
      <div className="h-2 rounded w-1/3 bg-neutral-800" />
    </div>
  </div>
);

export default function SearchLoading() {
  return (
    <div className="bg-black h-full w-full overflow-hidden overflow-y-auto pt-[30px]">
      {/* Header skeleton */}
      <div className="px-6 pt-8 pb-6 border-b border-neutral-800/40">
        <div className="flex items-center gap-x-3 mb-6">
          <div className="h-8 w-1 bg-red-600/60" />
          <div className="h-9 bg-neutral-800 rounded w-40 animate-pulse" />
        </div>
        {/* Search input skeleton */}
        <div className="h-11 bg-neutral-800/80 border border-neutral-700/40 rounded animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-x-4 px-6 mb-8 mt-4 border-b border-neutral-800/30">
        <div className="h-9 bg-neutral-800 rounded w-28 animate-pulse mb-2" />
        <div className="h-9 bg-neutral-800/50 rounded w-28 animate-pulse mb-2" />
      </div>

      {/* Results skeleton */}
      <div className="flex flex-col px-6 gap-y-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <SearchRowSkeleton key={i} delay={i * 40} gold={i % 4 === 2} />
        ))}
      </div>

      {/* Luanda HUD label */}
      <div className="flex items-center gap-x-2 px-6 mt-4">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#ffa500', boxShadow: '0 0 4px rgba(255,165,0,0.6)' }}
        />
        <span className="text-[9px] font-mono uppercase tracking-[0.3em]"
          style={{ color: 'rgba(255,165,0,0.5)' }}>
          Luanda FM · A sincronizar
        </span>
      </div>
    </div>
  );
}