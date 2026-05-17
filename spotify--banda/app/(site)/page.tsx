import Header from "@/components/Header";
import ListaItens from "@/components/ListaItens";
import PageContent from "./components/PageContent";
import getSongs from "@/actions/getSongs";
import { HiLightningBolt, HiSparkles, HiDatabase } from "react-icons/hi";

// Revalidate every 60 seconds instead of force-dynamic
// Home songs aren't per-user so they can be cached
export const revalidate = 60;

export default async function Home() {
  const { songs: allSongs } = await getSongs('', 0);

  const trendingSongs = allSongs.slice(0, 15);
  const newReleases = [...allSongs].reverse().slice(0, 15);

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto safe-top pt-[30px] pb-24 relative">

      <Header>
        <div className="mb-2 relative z-10">
          <div className="flex items-center gap-x-3 mb-4">
            <div className="h-8 w-1 bg-red-600 shadow-[0_0_10px_#ef4444]" />
            <h1 className="text-white text-4xl font-black uppercase tracking-tighter italic">
              Terminal: Online
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
            <ListaItens image="/images/likedit.png" name="Músicas Favoritas" href="liked" sizes={""} />
            <ListaItens image="/images/anime-boy-avatar-vector.jpg" name="MINHAS PLAYLISTS" href="playlists" sizes={""} />
          </div>
        </div>
      </Header>

      <div className="mt-4 mb-7 px-6 space-y-12">

        <section className="relative">
          <div className="flex items-center gap-x-2 mb-4">
            <HiLightningBolt className="text-red-500 animate-pulse" size={20} />
            <h2 className="text-white text-xl font-black uppercase tracking-widest">
              Hot Streak <span className="text-red-600/50 text-xs ml-2">[TRENDING]</span>
            </h2>
          </div>
          <div className="animate-glow-sweep rounded-xl bg-red-900/5 p-4 border border-red-500/10">
            <PageContent songs={trendingSongs} allSongs={allSongs} />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-x-2 mb-4">
            <HiSparkles className="text-red-500" size={20} />
            <h2 className="text-white text-xl font-black uppercase tracking-widest">
              Novas Frequências <span className="text-red-600/50 text-xs ml-2">[NEW]</span>
            </h2>
          </div>
          <PageContent songs={newReleases} allSongs={allSongs} />
        </section>

        <section className="relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
          <div className="flex items-center gap-x-2 mb-4 relative z-10">
            <HiDatabase className="text-red-500" size={20} />
            <h2 className="text-white text-xl font-black uppercase tracking-widest">
              Base de Dados <span className="text-red-600/50 text-xs ml-2">[ALL_SONGS]</span>
            </h2>
          </div>
          <div className="relative z-10">
            <PageContent songs={allSongs} allSongs={allSongs} />
          </div>
        </section>

      </div>

      <div className="fixed bottom-28 right-10 pointer-events-none hidden lg:block">
        <p className="text-[10px] text-red-500/20 font-mono rotate-90 origin-right tracking-[0.5em] uppercase">
          System_Authenticated // User_Root
        </p>
      </div>
    </div>
  );
}