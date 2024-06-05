import { NextApiRequest, NextApiResponse } from 'next';

export interface Song {
  title: string;
}

export interface Playlist {
  title: string;
  songs: Song[]
}

const playlists: Record<string, Playlist> = {
  '1': { title: 'My Playlist 1', songs: [{ title: 'Song 1' }, { title: 'Song 2' }] },
  '2': { title: 'My Playlist 2', songs: [{ title: 'Song A' }, { title: 'Song B' }] },
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  const playlist = playlists[id as string];

  if (playlist) {
    res.status(200).json(playlist);
  } else {
    res.status(404).json({ error: 'Playlist not found' });
  }
};