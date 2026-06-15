import { create } from 'zustand';
import { appSettingsService } from '@core/services/appSettingsService';
import type { AppSettings } from '@core/types/domain';

interface AppSettingsState {
  settings: AppSettings | null;
  saving: boolean;
  hydrate: () => Promise<void>;
  setAutoAcceptNewBookingRequests: (enabled: boolean) => Promise<void>;
}

export const useAppSettingsStore = create<AppSettingsState>(set => ({
  settings: null,
  saving: false,

  hydrate: async () => {
    const settings = await appSettingsService.getSettings();
    set({ settings });
  },

  setAutoAcceptNewBookingRequests: async enabled => {
    set({ saving: true });
    try {
      const settings = await appSettingsService.setAutoAcceptNewBookingRequests(enabled);
      set({ settings, saving: false });
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
}));
