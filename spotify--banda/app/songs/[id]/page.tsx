import SongDetails from "../components/SongDetails";

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

const SongPage = () => <SongDetails />;

export default SongPage;