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

    setId: (id: string) => set({ activeID: id }),

    setIds: (ids: string[]) => set({ ids }),

    setQueue: (songs: Song[]) => {
        if (songs.length === 0) return;
        set({ ids: songs.map(song => song.id), activeID: songs[0].id });
    },

    reset: () => set({ ids: [], activeID: undefined }),

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
            set({ activeID }); // Repeat current song
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
    }
}));

export default usePlayer;
