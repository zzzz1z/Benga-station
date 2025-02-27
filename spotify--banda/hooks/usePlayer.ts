import { Song } from '@/types';
import { create } from 'zustand';

interface PlayerStore {
    ids: string[];
    activeID?: string;
    setId: (id: string) => void;
    setIds: (ids: string[]) => void;
    setQueue: (songs: Song[]) => void;
    reset: () => void;
    playNext: () => void;
    playPrevious: () => void;
    playRandom: () => void;
}

const usePlayer = create<PlayerStore>((set, get) => ({
    ids: [],
    activeID: undefined,

    // Set active song ID
    setId: (id: string) => set({ activeID: id }),

    // Set list of song IDs
    setIds: (ids: string[]) => set({ ids }),

    // Set queue and start playing from the first song
    setQueue: (songs: Song[]) => {
        if (songs.length === 0) return;
        set({ ids: songs.map(song => song.id), activeID: songs[0].id });
    },

    // Reset the player
    reset: () => set({ ids: [], activeID: undefined }),

    // Play the next song in the queue
    playNext: () => {
        const { ids, activeID } = get();
        if (!ids.length) return;

        const currentIndex = ids.findIndex(id => id === activeID);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % ids.length;

        set({ activeID: ids[nextIndex] });
    },

    // Play the previous song in the queue
    playPrevious: () => {
        const { ids, activeID } = get();
        if (!ids.length) return;

        const currentIndex = ids.findIndex(id => id === activeID);
        const prevIndex = currentIndex === -1 ? ids.length - 1 : (currentIndex - 1 + ids.length) % ids.length;

        set({ activeID: ids[prevIndex] });
    },

    // Play a random song from the queue
    playRandom: () => {
        const { ids, activeID } = get();
        if (!ids.length) return;

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * ids.length);
        } while (ids[randomIndex] === activeID && ids.length > 1);

        set({ activeID: ids[randomIndex] });
    }
}));

export default usePlayer;
