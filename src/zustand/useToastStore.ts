import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
  showToast: (message: string, options?: { type?: ToastType; duration?: number }) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  visible: false,
  message: '',
  type: 'info',
  duration: 3500,
  showToast: (message, options) =>
    set({
      visible: true,
      message,
      type: options?.type ?? 'info',
      duration: options?.duration ?? 3500,
    }),
  hideToast: () => set({ visible: false }),
}));
