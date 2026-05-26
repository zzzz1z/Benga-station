import PlaylistDetails from '../components/PlaylistDetails';

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

const PlaylistPage = () => <PlaylistDetails />;

export default PlaylistPage;