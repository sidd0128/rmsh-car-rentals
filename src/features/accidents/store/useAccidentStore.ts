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
}));
