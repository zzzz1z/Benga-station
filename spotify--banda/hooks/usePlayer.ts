import { Song } from '@/types';
import { create } from 'zustand';

interface PlayerStore {
    ids: string[];
    songs: Record<string, Song>;
    activeID?: string;
    failedIds: Set<string>;
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
}

const getSongPlayerId = (song: Song): string =>
    song.source === 'youtube' && song.youtube_video_id
        ? `yt_${song.youtube_video_id}`
        : String(song.id);

const usePlayer = create<PlayerStore>((set, get) => ({
    ids: [],
    songs: {},
    activeID: undefined,
    failedIds: new Set(),

    setId: (id: string) => set({ activeID: id }),
    setIds: (ids: string[]) => set({ ids }),

    setQueue: (songs: Song[], startId?: string) => {
        if (songs.length === 0) return;
        const songMap = songs.reduce<Record<string, Song>>((acc, song) => {
            const pid = getSongPlayerId(song);
            acc[pid] = song;
            return acc;
        }, {});
        const ids = songs.map(getSongPlayerId);
        set({
            ids,
            songs: songMap,
            activeID: startId ?? ids[0],
        });
    },

    // Safe append — never replaces existing entries, never touches activeID
    appendToQueue: (songs: Song[]) => {
        if (songs.length === 0) return;
        const { ids: currentIds, songs: currentSongs } = get();
        const existingIdSet = new Set(currentIds);
        const newSongs = songs.filter(s => !existingIdSet.has(getSongPlayerId(s)));
        if (newSongs.length === 0) return;

        const addedMap = newSongs.reduce<Record<string, Song>>((acc, song) => {
            acc[getSongPlayerId(song)] = song;
            return acc;
        }, {});

        set({
            // Spread existing songs first so active song entry is never clobbered
            songs: { ...currentSongs, ...addedMap },
            ids: [...currentIds, ...newSongs.map(getSongPlayerId)],
        });
    },

    reset: () => set({ ids: [], songs: {}, activeID: undefined, failedIds: new Set() }),

    markFailed: (id: string) => {
        set(state => ({
            failedIds: new Set([...state.failedIds, id]),
            ids: state.ids.filter(i => i !== id),
        }));
        // no auto-skip — prevents cascade failure
    },

    playNext: () => {
        const { ids, activeID, playRandom } = get();
        if (!ids.length || activeID === undefined) {
            playRandom();
            return;
        }
        const currentIndex = ids.findIndex(id => id === activeID);
        if (currentIndex === -1 || currentIndex === ids.length - 1) {
            playRandom();
        } else {
            set({ activeID: ids[currentIndex + 1] });
        }
    },

    playPrevious: () => {
        const { ids, activeID } = get();
        if (!ids.length || activeID === undefined) return;
        const currentIndex = ids.findIndex(id => id === activeID);
        if (currentIndex <= 0) {
            set({ activeID });
        } else {
            set({ activeID: ids[currentIndex - 1] });
        }
    },

    playRandom: () => {
        const { ids, activeID } = get();
        if (!ids.length) return;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * ids.length);
        } while (ids.length > 1 && ids[randomIndex] === activeID);
        set({ activeID: ids[randomIndex] });
    },

    hasPrevious: () => {
        const { ids, activeID } = get();
        if (!ids.length || activeID === undefined) return false;
        const currentIndex = ids.findIndex(id => id === activeID);
        return currentIndex > 0;
    }
}));

export default usePlayer;