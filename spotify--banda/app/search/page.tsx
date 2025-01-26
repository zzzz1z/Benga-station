import getSongsByT from "@/actions/getSongsByT";
import getSongsByAuthor from "@/actions/getSongsByAuthor"; // New action
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import SearchContent from "./components/SearchContent";
import { Song } from "@/types";

interface SearchProps {
  searchParams: Promise<{
    title: string;
    author?: string; // Include author in query params
  }>;
}

export const revalidate = 0;

const Search = async (props: SearchProps) => {
  const searchParams = await props.searchParams;

  // Fetch songs matching the search
  const songs = await getSongsByT(searchParams.title);

  // Fetch all songs by the searched author
  let authorSongs: Song[] = [];
  if (searchParams.author) {
    authorSongs = await getSongsByAuthor(searchParams.author);
  }

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
      <SearchContent songs={songs} authorSongs={authorSongs} />
    </div>
  );
};

export default Search;
