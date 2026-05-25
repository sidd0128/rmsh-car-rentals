import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import type { AccidentRecord, CreateAccidentPayload } from '@core/types/domain';

interface AccidentState {
  accidents: AccidentRecord[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
  addAccident: (payload: CreateAccidentPayload) => Promise<AccidentRecord>;
  updateAccident: (record: AccidentRecord) => Promise<void>;
  deleteAccident: (id: string) => Promise<void>;
}

export const useAccidentStore = create<AccidentState>((set, get) => ({
  accidents: [],
  isLoading: false,

  hydrate: async () => {
    set({ isLoading: true });
    const accidents = await repositories.accidents.getAccidents();
    set({ accidents, isLoading: false });
  },

  addAccident: async payload => {
    const record = await repositories.accidents.addAccident(payload);
    const customer = await repositories.customers.getCustomerById(payload.customerId);
    if (customer) {
      await repositories.customers.updateCustomer({
        ...customer,
        accidentHistory: [...customer.accidentHistory, record.id],
      });
    }
    set({ accidents: [...get().accidents, record] });
    return record;
  },

  updateAccident: async record => {
    await repositories.accidents.updateAccident(record);
    set({ accidents: get().accidents.map(a => (a.id === record.id ? record : a)) });
  },

  deleteAccident: async id => {
    await repositories.accidents.deleteAccident(id);
    set({ accidents: get().accidents.filter(a => a.id !== id) });
  },
}));
