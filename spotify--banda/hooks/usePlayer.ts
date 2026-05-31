import { Song } from '@/types';
import { create } from 'zustand';
import { getSongPlayerId } from './useOnPlay';

type RepeatMode = 'off' | 'all' | 'one';

export type QueueSource = 'playlist' | 'home' | 'search';

export interface QueueContext {
  source: QueueSource;
  playlistId?: string;
  playlistName?: string;
  searchQuery?: string;
}

interface PlayerStore {
  ids: string[];
  originalIds: string[];
  songs: Record<string, Song>;
  activeID?: string;
  playCount: number;
  failedIds: Set<string>;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  queueContext: QueueContext;
  history: string[];
  setId: (id: string) => void;
  setIds: (ids: string[]) => void;
  setQueue: (songs: Song[], startId?: string, context?: QueueContext) => void;
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

const pushHistory = (history: string[], id: string): string[] => {
  const next = [...history, id];
  return next.length > 20 ? next.slice(-20) : next;
};

const saveToSession = (state: {
  ids: string[];
  originalIds: string[];
  songs: Record<string, Song>;
  activeID?: string;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  queueContext: QueueContext;
  history: string[];
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
  queueContext?: QueueContext;
  history?: string[];
} | null => {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) { return null; }
};

export const DEFAULT_CONTEXT: QueueContext = { source: 'home' };

const usePlayer = create<PlayerStore>((set, get) => ({
  ids: [],
  originalIds: [],
  songs: {},
  activeID: undefined,
  playCount: 0,
  failedIds: new Set(),
  shuffleOn: false,
  repeatMode: 'off',
  queueContext: DEFAULT_CONTEXT,
  history: [],

  setId: (id) => {
    const { activeID, history } = get();
    const newHistory = activeID && activeID !== id ? pushHistory(history, activeID) : history;
    set({ activeID: id, history: newHistory });
    const s = get();
    saveToSession({
      ids: s.ids,
      originalIds: s.originalIds,
      songs: s.songs,
      activeID: id,
      shuffleOn: s.shuffleOn,
      repeatMode: s.repeatMode,
      queueContext: s.queueContext,
      history: newHistory,
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
      queueContext: s.queueContext,
      history: s.history,
    });
  },

  setQueue: (songs, startId, context) => {
    if (!songs.length) return;
    const songMap = songs.reduce<Record<string, Song>>((acc, song) => {
      acc[getSongPlayerId(song)] = song;
      return acc;
    }, {});
    const ids = songs.map(getSongPlayerId);
    const activeID = startId ?? ids[0];
    const { shuffleOn, repeatMode, activeID: prevActiveID, history } = get();
    const newContext = context ?? DEFAULT_CONTEXT;
    const newHistory = prevActiveID && prevActiveID !== activeID
      ? pushHistory(history, prevActiveID)
      : history;

    let finalIds = ids;
    if (shuffleOn) {
      const rest = ids.filter(id => id !== activeID);
      finalIds = [activeID, ...shuffleArray(rest)];
    }

    set({ ids: finalIds, originalIds: ids, songs: songMap, activeID, queueContext: newContext, history: newHistory });
    preExtractQueue(finalIds.slice(0, 5));
    saveToSession({ ids: finalIds, originalIds: ids, songs: songMap, activeID, shuffleOn, repeatMode, queueContext: newContext, history: newHistory });
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
      queueContext: s.queueContext,
      history: s.history,
    });
  },

  reset: () => {
    set({ ids: [], originalIds: [], songs: {}, activeID: undefined, failedIds: new Set(), queueContext: DEFAULT_CONTEXT, history: [] });
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
      queueContext: s.queueContext,
      history: s.history,
    });
  },

  setShuffleOn: (value) => {
    const { ids, originalIds, activeID } = get();
    const currentIndex = ids.indexOf(activeID ?? '');

    if (value) {
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
        queueContext: s.queueContext,
        history: s.history,
      });
    } else {
      const originalIndex = originalIds.indexOf(activeID ?? '');
      const restored = originalIndex >= 0 ? [...originalIds] : originalIds;

      set({ shuffleOn: false, ids: restored, activeID: activeID ?? undefined });
      const s = get();
      saveToSession({
        ids: restored,
        originalIds: s.originalIds,
        songs: s.songs,
        activeID: activeID ?? undefined,
        shuffleOn: false,
        repeatMode: s.repeatMode,
        queueContext: s.queueContext,
        history: s.history,
      });
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
      queueContext: s.queueContext,
      history: s.history,
    });
  },

  playNext: () => {
    const { ids, activeID, repeatMode, playCount, queueContext, history } = get();

    if (repeatMode === 'one' && activeID) {
      set({ playCount: playCount + 1 });
      return;
    }
    if (!ids.length || activeID === undefined) return;

    const currentIndex = ids.indexOf(activeID);
    const newHistory = pushHistory(history, activeID);

    if (repeatMode === 'all') {
      const nextIndex = currentIndex === ids.length - 1 ? 0 : currentIndex + 1;
      const nextId = ids[nextIndex];
      set({ activeID: nextId, history: newHistory });
      const s = get();
      saveToSession({
        ids: s.ids, originalIds: s.originalIds, songs: s.songs,
        activeID: nextId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
        queueContext: s.queueContext, history: newHistory,
      });
      return;
    }

    if (currentIndex === ids.length - 1 && queueContext.source === 'playlist') {
      const nextId = ids[0];
      set({ activeID: nextId, history: newHistory });
      const s = get();
      saveToSession({
        ids: s.ids, originalIds: s.originalIds, songs: s.songs,
        activeID: nextId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
        queueContext: s.queueContext, history: newHistory,
      });
      return;
    }

    if (currentIndex === -1 || currentIndex === ids.length - 1) return;
    const nextId = ids[currentIndex + 1];
    set({ activeID: nextId, history: newHistory });
    const s = get();
    saveToSession({
      ids: s.ids, originalIds: s.originalIds, songs: s.songs,
      activeID: nextId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
      queueContext: s.queueContext, history: newHistory,
    });
  },

  playPrevious: () => {
    const { ids, activeID, history } = get();
    if (!ids.length || !activeID) return;

    if (history.length > 0) {
      const newHistory = [...history];
      const prevId = newHistory.pop()!;
      set({ activeID: prevId, history: newHistory });
      const s = get();
      saveToSession({
        ids: s.ids, originalIds: s.originalIds, songs: s.songs,
        activeID: prevId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
        queueContext: s.queueContext, history: newHistory,
      });
      return;
    }

    // No history — stay on current song
    set({ activeID });
    const s = get();
    saveToSession({
      ids: s.ids, originalIds: s.originalIds, songs: s.songs,
      activeID, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
      queueContext: s.queueContext, history: s.history,
    });
  },

  playRandom: () => {
    const { ids, activeID, history } = get();
    if (!ids.length) return;
    let idx: number;
    do { idx = Math.floor(Math.random() * ids.length); }
    while (ids.length > 1 && ids[idx] === activeID);
    const randomId = ids[idx];
    const newHistory = activeID ? pushHistory(history, activeID) : history;
    set({ activeID: randomId, history: newHistory });
    const s = get();
    saveToSession({
      ids: s.ids, originalIds: s.originalIds, songs: s.songs,
      activeID: randomId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
      queueContext: s.queueContext, history: newHistory,
    });
  },

  hasPrevious: () => {
    const { history, ids, activeID } = get();
    if (history.length > 0) return true;
    if (!ids.length || !activeID) return false;
    return ids.indexOf(activeID) > 0;
  },
}));

export default usePlayer;