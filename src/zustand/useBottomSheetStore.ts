import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface GlobalBottomSheetOptions {
  title?: string;
  content: ReactNode;
  snapPoints?: (string | number)[];
  scrollable?: boolean;
  onDismiss?: () => void;
}

interface BottomSheetState {
  sheet: GlobalBottomSheetOptions | null;
  showBottomSheet: (options: GlobalBottomSheetOptions) => void;
  hideBottomSheet: () => void;
}

export const useBottomSheetStore = create<BottomSheetState>(set => ({
  sheet: null,
  showBottomSheet: options => set({ sheet: options }),
  hideBottomSheet: () => set({ sheet: null }),
}));
