import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import type { AccidentRecord, CreateAccidentPayload } from '@core/types/domain';

interface AccidentState {
  accidents: AccidentRecord[];
  hydrate: () => Promise<void>;
  addAccident: (payload: CreateAccidentPayload) => Promise<AccidentRecord>;
}

export const useAccidentStore = create<AccidentState>((set, get) => ({
  accidents: [],

  hydrate: async () => {
    const accidents = await repositories.accidents.getAccidents();
    set({ accidents });
  },

  addAccident: async payload => {
    const record = await repositories.accidents.addAccident(payload);
    set({ accidents: [...get().accidents, record] });
    return record;
  },
}));
