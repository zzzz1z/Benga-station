import { Song } from '@/types';
import { create } from 'zustand';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerStore {
  ids: string[];
  originalIds: string[];
  songs: Record<string, Song>;
  activeID?: string;
  playCount: number;
  failedIds: Set<string>;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  setId: (id: string) => void;
  setIds: (ids: string[]) => void;
  setQueue: (songs: Song[], startId?: string) => void;
  appendToQueue: (songs: Song[]) => void;
  reset: () => void;
  playNext: () => void;
  playPrevious: () => void;
  playRandom: () => void;
  hasPrevious: () => boolean;
  markFailed: (id: string) => void;
  setShuffleOn: (value: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
}

const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const preExtractQueue = (ids: string[]) => {
  const videoIds = ids
    .filter(id => id.startsWith('yt_'))
    .map(id => id.slice(3));
  if (!videoIds.length) return;
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract-queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds }),
  }).catch(() => {});
};

const SS_KEY = 'benga_player_state';

const saveToSession = (state: {
  ids: string[];
  originalIds: string[];
  songs: Record<string, Song>;
  activeID?: string;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
}) => {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch (_) {}
};

export const loadFromSession = (): {
  ids: string[];
  originalIds: string[];
  songs: Record<string, Song>;
  activeID?: string;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
} | null => {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) { return null; }
};

const usePlayer = create<PlayerStore>((set, get) => ({
  ids: [],
  originalIds: [],
  songs: {},
  activeID: undefined,
  playCount: 0,
  failedIds: new Set(),
  shuffleOn: false,
  repeatMode: 'off',

  setId: (id) => {
    set({ activeID: id });
    const s = get();
    saveToSession({
      ids: s.ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: id,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
    });
  },

  setIds: (ids) => {
    set({ ids });
    const s = get();
    saveToSession({
      ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: s.activeID,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
    });
  },

  setQueue: (songs, startId) => {
    if (!songs.length) return;
    const songMap = songs.reduce<Record<string, Song>>((acc, song) => {
      acc[getSongPlayerId(song)] = song;
      return acc;
    }, {});
    const ids = songs.map(getSongPlayerId);
    const activeID = startId ?? ids[0];
    const { shuffleOn, repeatMode } = get();

    let finalIds = ids;
    if (shuffleOn) {
      // New queue with shuffle on — put start song first, shuffle the rest
      const rest = ids.filter(id => id !== activeID);
      finalIds = [activeID, ...shuffleArray(rest)];
    }

    set({ ids: finalIds, originalIds: ids, songs: songMap, activeID });
    preExtractQueue(finalIds.slice(0, 5));
    saveToSession({ ids: finalIds, originalIds: ids, songs: songMap, activeID, shuffleOn, repeatMode });
  },

  appendToQueue: (songs) => {
    if (!songs.length) return;
    const { ids: currentIds, songs: currentSongs, originalIds } = get();
    const existingSet = new Set(currentIds);
    const newSongs = songs.filter(s => !existingSet.has(getSongPlayerId(s)));
    if (!newSongs.length) return;

    const addedMap = newSongs.reduce<Record<string, Song>>((acc, song) => {
      acc[getSongPlayerId(song)] = song;
      return acc;
    }, {});

    const newIds = [...currentIds, ...newSongs.map(getSongPlayerId)];
    const newOriginalIds = [...originalIds, ...newSongs.map(getSongPlayerId)];

    set({ songs: { ...currentSongs, ...addedMap }, ids: newIds, originalIds: newOriginalIds });
    preExtractQueue(newSongs.map(getSongPlayerId));

    const s = get();
    saveToSession({
      ids: newIds,
      originalIds: newOriginalIds,
      songs: s.songs,
      activeID: s.activeID,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
    });
  },

  reset: () => {
    set({ ids: [], originalIds: [], songs: {}, activeID: undefined, failedIds: new Set() });
    try { sessionStorage.removeItem(SS_KEY); } catch (_) {}
  },

  markFailed: (id) => {
    set(state => ({
      failedIds: new Set([...state.failedIds, id]),
      ids: state.ids.filter(i => i !== id),
      originalIds: state.originalIds.filter(i => i !== id),
    }));
    const s = get();
    saveToSession({
      ids: s.ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: s.activeID,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
    });
  },

  setShuffleOn: (value) => {
    const { ids, originalIds, activeID } = get();
    const currentIndex = ids.indexOf(activeID ?? '');

    if (value) {
      // Keep songs up to and including current untouched
      // Shuffle only songs after current
      const before = currentIndex >= 0 ? ids.slice(0, currentIndex + 1) : (activeID ? [activeID] : []);
      const after = currentIndex >= 0 ? ids.slice(currentIndex + 1) : ids;
      const shuffledAfter = shuffleArray(after);
      const shuffled = [...before, ...shuffledAfter];

      set({ shuffleOn: true, ids: shuffled, originalIds: ids });
      preExtractQueue(shuffledAfter.slice(0, 5));

      const s = get();
      saveToSession({
        ids: shuffled,
        originalIds: ids,
        songs: s.songs,
        activeID: s.activeID,
        shuffleOn: true,
        repeatMode: s.repeatMode,
      });
    } else {
      // Restore original order, find current song, keep it as active
      const originalIndex = originalIds.indexOf(activeID ?? '');
      const restored = originalIndex >= 0
        ? originalIds
        : [...(activeID ? [activeID] : []), ...originalIds.filter(id => id !== activeID)];

      set({ shuffleOn: false, ids: restored });
      const s = get();
      saveToSession({
        ids: restored,
        originalIds: s.originalIds,
        songs: s.songs,
        activeID: s.activeID,
        shuffleOn: false,
        repeatMode: s.repeatMode,
      });

      console.log('originalIds', originalIds);
console.log('restored', restored);
    }

    
  },

  setRepeatMode: (mode) => {
    set({ repeatMode: mode });
    const s = get();
    saveToSession({
      ids: s.ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: s.activeID,
      shuffleOn: s.shuffleOn,
      repeatMode: mode,
    });
  },

  playNext: () => {
    const { ids, activeID, repeatMode, playCount } = get();

    if (repeatMode === 'one' && activeID) {
      set({ playCount: playCount + 1 });
      return;
    }
    if (!ids.length || activeID === undefined) return;

    const currentIndex = ids.indexOf(activeID);

    if (repeatMode === 'all') {
      const nextIndex = currentIndex === ids.length - 1 ? 0 : currentIndex + 1;
      const nextId = ids[nextIndex];
      set({ activeID: nextId });
      const s = get();
      saveToSession({
        ids: s.ids,
        originalIds: s.originalIds,
        songs: s.songs,
        activeID: nextId,
        shuffleOn: s.shuffleOn,
        repeatMode: s.repeatMode,
      });
      return;
    }

    if (currentIndex === -1 || currentIndex === ids.length - 1) return;
    const nextId = ids[currentIndex + 1];
    set({ activeID: nextId });
    const s = get();
    saveToSession({
      ids: s.ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: nextId,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
    });
  },

  playPrevious: () => {
    const { ids, activeID } = get();
    if (!ids.length || !activeID) return;
    const currentIndex = ids.indexOf(activeID);
    const prevId = currentIndex <= 0 ? activeID : ids[currentIndex - 1];
    set({ activeID: prevId });
    const s = get();
    saveToSession({
      ids: s.ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: prevId,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
    });
  },

  playRandom: () => {
    const { ids, activeID } = get();
    if (!ids.length) return;
    let idx: number;
    do { idx = Math.floor(Math.random() * ids.length); }
    while (ids.length > 1 && ids[idx] === activeID);
    const randomId = ids[idx];
    set({ activeID: randomId });
    const s = get();
    saveToSession({
      ids: s.ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: randomId,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
    });
  },

  hasPrevious: () => {
    const { ids, activeID } = get();
    if (!ids.length || !activeID) return false;
    return ids.indexOf(activeID) > 0;
  },
}));

export default usePlayer;