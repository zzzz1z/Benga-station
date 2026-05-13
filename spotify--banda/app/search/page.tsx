import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import SearchTabs from "./components/SearchTabs";
import getSongs from "@/actions/getSongs";

interface SearchProps {
  searchParams: Promise<{
    title: string;
    yt?: string;
  }>;
}

export const dynamic = 'force-dynamic';

const Search = async (props: SearchProps) => {
  const searchParams = await props.searchParams;
  const title = searchParams.title || '';
  const yt = searchParams.yt === '1';
  const songs = await getSongs(title);

  return (
    <div className="bg-black h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header className="from-black">
        <div className="mb-2 flex flex-col gap-y-6">
          <div className="flex items-center gap-x-3">
            <div className="h-8 w-1 bg-red-600" /> {/* Vertical HUD Bar */}
            <h1 className="text-white text-4xl font-black uppercase tracking-tighter">
              Pesquisar<span className="text-red-600">.</span>
            </h1>
          </div>
          <SearchInput />
        </div>
      </Header>
      <SearchTabs title={title} songs={songs} triggerYT={yt} />
    </div>
  );
};

export default Search;