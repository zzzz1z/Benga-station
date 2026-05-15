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

const warmIds = (ids: string[]) => {
    const videoIds = ids
        .filter(id => id.startsWith('yt_'))
        .map(id => id.replace('yt_', ''));
    if (videoIds.length === 0) return;
    fetch('/api/warm-batch', {
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
    try {
        sessionStorage.setItem(SS_KEY, JSON.stringify(state));
    } catch (_) {}
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
    } catch (_) {
        return null;
    }
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

    setId: (id: string) => {
        set({ activeID: id });
        const { ids } = get();
        const idx = ids.findIndex(i => i === id);
        const toWarm = [id, ids[idx + 1], ids[idx + 2]].filter(Boolean) as string[];
        warmIds(toWarm);
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

    setIds: (ids: string[]) => {
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

    setShuffleOn: (value: boolean) => {
        const { ids, originalIds, activeID } = get();
        if (value) {
            const rest = ids.filter(id => id !== activeID);
            const shuffled = activeID
                ? [activeID, ...shuffleArray(rest)]
                : shuffleArray(ids);
            set({ shuffleOn: true, ids: shuffled });
            const s = get();
            saveToSession({
                ids: shuffled,
                originalIds: s.originalIds,
                songs: s.songs,
                activeID: s.activeID,
                shuffleOn: true,
                repeatMode: s.repeatMode,
            });
        } else {
            const restored = originalIds.length > 0 ? originalIds : ids;
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

    setQueue: (songs: Song[], startId?: string) => {
        if (songs.length === 0) return;
        const songMap = songs.reduce<Record<string, Song>>((acc, song) => {
            const pid = getSongPlayerId(song);
            acc[pid] = song;
            return acc;
        }, {});
        const ids = songs.map(getSongPlayerId);
        const activeID = startId ?? ids[0];
        const { shuffleOn } = get();

        let finalIds = ids;
        if (shuffleOn) {
            const rest = ids.filter(id => id !== activeID);
            finalIds = [activeID, ...shuffleArray(rest)];
        }

        set({
            ids: finalIds,
            originalIds: ids,
            songs: songMap,
            activeID,
        });

        // Warm active + next 2
        const idx = finalIds.findIndex(id => id === activeID);
        const toWarm = [activeID, finalIds[idx + 1], finalIds[idx + 2]].filter(Boolean) as string[];
        warmIds(toWarm);

        saveToSession({
            ids: finalIds,
            originalIds: ids,
            songs: songMap,
            activeID,
            shuffleOn,
            repeatMode: get().repeatMode,
        });
    },

    appendToQueue: (songs: Song[]) => {
        if (songs.length === 0) return;
        const { ids: currentIds, songs: currentSongs, originalIds } = get();
        const existingIdSet = new Set(currentIds);
        const newSongs = songs.filter(s => !existingIdSet.has(getSongPlayerId(s)));
        if (newSongs.length === 0) return;

        const addedMap = newSongs.reduce<Record<string, Song>>((acc, song) => {
            acc[getSongPlayerId(song)] = song;
            return acc;
        }, {});

        const newIds = [...currentIds, ...newSongs.map(getSongPlayerId)];
        const newOriginalIds = [...originalIds, ...newSongs.map(getSongPlayerId)];

        set({
            songs: { ...currentSongs, ...addedMap },
            ids: newIds,
            originalIds: newOriginalIds,
        });

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

    markFailed: (id: string) => {
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

    playNext: () => {
        const { ids, activeID, repeatMode, shuffleOn, playRandom, playCount } = get();

        if (repeatMode === 'one' && activeID) {
            set({ playCount: playCount + 1 });
            return;
        }

        if (!ids.length || activeID === undefined) {
            playRandom();
            return;
        }

        if (shuffleOn) {
            playRandom();
            return;
        }

        const currentIndex = ids.findIndex(id => id === activeID);

        if (repeatMode === 'all') {
            const nextIndex = currentIndex === ids.length - 1 ? 0 : currentIndex + 1;
            const nextId = ids[nextIndex];
            set({ activeID: nextId });
            const toWarm = [nextId, ids[nextIndex + 1], ids[nextIndex + 2]].filter(Boolean) as string[];
            warmIds(toWarm);
            const s = get();
            saveToSession({
                ids: s.ids, originalIds: s.originalIds, songs: s.songs,
                activeID: nextId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
            });
            return;
        }

        if (currentIndex === -1 || currentIndex === ids.length - 1) return;
        const nextId = ids[currentIndex + 1];
        set({ activeID: nextId });
        const toWarm = [nextId, ids[currentIndex + 2], ids[currentIndex + 3]].filter(Boolean) as string[];
        warmIds(toWarm);
        const s = get();
        saveToSession({
            ids: s.ids, originalIds: s.originalIds, songs: s.songs,
            activeID: nextId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
        });
    },

    playPrevious: () => {
        const { ids, activeID } = get();
        if (!ids.length || activeID === undefined) return;
        const currentIndex = ids.findIndex(id => id === activeID);
        const prevId = currentIndex <= 0 ? activeID : ids[currentIndex - 1];
        set({ activeID: prevId });
        const s = get();
        saveToSession({
            ids: s.ids, originalIds: s.originalIds, songs: s.songs,
            activeID: prevId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
        });
    },

    playRandom: () => {
        const { ids, activeID } = get();
        if (!ids.length) return;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * ids.length);
        } while (ids.length > 1 && ids[randomIndex] === activeID);
        const randomId = ids[randomIndex];
        set({ activeID: randomId });
        // Warm the next 3 from this position in the shuffled ids
        const toWarm = [randomId, ids[randomIndex + 1], ids[randomIndex + 2], ids[randomIndex + 3]]
            .filter(Boolean) as string[];
        warmIds(toWarm);
        const s = get();
        saveToSession({
            ids: s.ids, originalIds: s.originalIds, songs: s.songs,
            activeID: randomId, shuffleOn: s.shuffleOn, repeatMode: s.repeatMode,
        });
    },

    hasPrevious: () => {
        const { ids, activeID } = get();
        if (!ids.length || activeID === undefined) return false;
        return ids.findIndex(id => id === activeID) > 0;
    },
}));

export default usePlayer;