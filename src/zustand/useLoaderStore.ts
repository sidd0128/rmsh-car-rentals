import { create } from 'zustand';

interface LoaderState {
  visible: boolean;
  message?: string;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
}

export const useLoaderStore = create<LoaderState>(set => ({
  visible: false,
  message: undefined,
  showLoader: message => set({ visible: true, message }),
  hideLoader: () => set({ visible: false, message: undefined }),
}));
