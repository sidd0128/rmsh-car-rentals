import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface GlobalDialogOptions {
  title: string;
  message?: string;
  content?: ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
}

interface ModalState {
  alert: GlobalDialogOptions | null;
  modal: GlobalDialogOptions | null;
  showAlert: (options: GlobalDialogOptions) => void;
  hideAlert: () => void;
  showModal: (options: GlobalDialogOptions) => void;
  hideModal: () => void;
}

export const useModalStore = create<ModalState>(set => ({
  alert: null,
  modal: null,
  showAlert: options => set({ alert: options }),
  hideAlert: () => set({ alert: null }),
  showModal: options => set({ modal: options }),
  hideModal: () => set({ modal: null }),
}));
