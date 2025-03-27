import { create } from 'zustand';

interface AuthModalStore {
    isOpen: boolean;
    mode: "sign_in" | "sign_up"; // 👈 Store the mode
    onOpen: (mode: "sign_in" | "sign_up") => void; // 👈 Accept mode
    onClose: () => void;
}

const useAuthModal = create<AuthModalStore>((set) => ({
    isOpen: false,
    mode: "sign_in", // Default mode
    onOpen: (mode) => set({ isOpen: true, mode }), // 👈 Set mode when opening
    onClose: () => set({ isOpen: false }),
}));

export default useAuthModal;
