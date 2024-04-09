import { create } from 'zustand'

interface PlayerStore {
    ids: string[];
    activeID?: string;
    setId: (id: string) => void;
    setIds: (ids: string[]) => void;
    reset: () => void;
};


const usePlayer = create<PlayerStore>((set) => ({
    ids: [],
    activeID: undefined,
    setId: (id: string) => set({ activeID: id}),
    setIds: (ids: string[]) => set({ ids: ids}),
    reset: () => set({ ids: [], activeID: undefined})



}));


export default usePlayer;