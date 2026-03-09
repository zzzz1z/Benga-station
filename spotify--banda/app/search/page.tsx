import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import SearchContent from "./components/SearchContent";
import { Song } from "@/types";
import getSongs from "@/actions/getSongs";

interface SearchProps {
  searchParams: Promise<{
    title: string;
    author?: string; // Include author in query params
  }>;
}

export const dynamic = 'force-dynamic';

const Search = async (props: SearchProps) => {
  const searchParams = await props.searchParams;

  // Fetch songs matching the search
  const songs = await getSongs(searchParams.title);


  return (
    <div
      className="
        bg-neutral-900
        rounded-lg
        h-full
        w-full
        overflow-hidden
        overflow-y-auto
      "
    >
      <Header className="from-bg-neutral-900">
        <div className="mb-2 flex flex-col gap-y-6">
          <h1 className="text-white text-3xl font-semibold">Pesquisar</h1>
          <SearchInput />
        </div>
      </Header>
      <SearchContent songs={songs} />
    </div>
  );
};

export default Search;
