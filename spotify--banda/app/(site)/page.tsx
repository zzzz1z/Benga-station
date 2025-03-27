import getSongs from "@/actions/getSongs"; // Assuming this fetches your songs
import Header from "@/components/Header"; // Your header component
import ListaItens from "@/components/ListaItens"; // A component for listing items
import PageContent from "./components/PageContent"; // A component that handles page content
import getMostRecentSongs from "@/actions/getMostRecentSongs";
import AddContent from "./components/AddContent";

// No need to revalidate at 0, unless you're using a particular caching mechanism
// export const revalidate = 0; // Remove this if unnecessary

export default async function Home() {
  // Fetch songs asynchronously using your helper function
  const songs = await getSongs();
  const otherSongs = await getMostRecentSongs();
  

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      {/* Header Section */}
      <Header>
        <div className="mb-2">
          <h1 className="text-white text-3xl font-semibold">
            Bem vindo de volta! 🥳
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
            {/* Render 'ListaItens' component here */}
            <ListaItens
              fill // Using `fill` for responsive layout
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Ensures responsive images
              image="/images/likedit.png" // Default image
              name="Músicas favoritas" // Name of the playlist or section
              href="liked" // Link to the liked songs or playlist
            />
          </div>
        </div>
      </Header>

      <div className="mt-2 mb-7 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-2xl font-semibold">Adicionadas Recentemente</h1>
        </div>

        {/* Passing the songs data to 'PageContent' */}
        <AddContent songs={songs} />
      </div>

      {/* Page Content Section */}
      <div className="mt-2 mb-7 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-2xl font-semibold">Explore as nossas músicas</h1>
        </div>

        {/* Passing the songs data to 'PageContent' */}
        <PageContent songs={otherSongs} />
      </div>
    </div>
  );
}
