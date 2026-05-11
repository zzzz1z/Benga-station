import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import SearchContent from "./components/SearchContent";
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
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[60px] overflow-y-auto">
      <Header className="from-bg-neutral-900">
        <div className="mb-2 flex flex-col gap-y-6">
          <h1 className="text-white text-3xl font-semibold">Pesquisar</h1>
          <SearchInput />
        </div>
      </Header>
      <SearchTabs title={title} songs={songs} triggerYT={yt} />
    </div>
  );
};

export default Search;