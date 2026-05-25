import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandPersistStorage } from '@core/storage/zustandPersistStorage';

export type CarFilter = 'ALL' | 'AVAILABLE' | 'ON_RENT' | 'UPCOMING_BOOKING';

interface CarFilterState {
  filter: CarFilter;
  searchQuery: string;
  setFilter: (filter: CarFilter) => void;
  setSearchQuery: (query: string) => void;
}

export const useCarFilterStore = create<CarFilterState>()(
  persist(
    set => ({
      filter: 'AVAILABLE',
      searchQuery: '',
      setFilter: filter => set({ filter }),
      setSearchQuery: searchQuery => set({ searchQuery }),
    }),
    {
      name: '@rmsh/car-filter-prefs',
      storage: createJSONStorage(() => zustandPersistStorage),
    },
  ),
);
