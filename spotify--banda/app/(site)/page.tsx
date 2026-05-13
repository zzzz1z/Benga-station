import Header from "@/components/Header";
import ListaItens from "@/components/ListaItens";
import PageContent from "./components/PageContent";
import getSongs from "@/actions/getSongs";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const songs = await getSongs();

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto safe-top pt-[30px] pb-24">
      <Header>
        <div className="mb-2">
          <h1 className="text-white text-3xl font-semibold">
            Bem vindo de volta! 
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
            <ListaItens
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              image="/images/likedit.png"
              name="Músicas favoritas"
              href="liked"
            />
          </div>
        </div>
      </Header>

   

      <div className="mt-2 mb-7 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-2xl font-semibold">Explore as nossas músicas</h1>
        </div>
        <PageContent songs={songs} />
      </div>
    </div>
  );
}