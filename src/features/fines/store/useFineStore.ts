import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import type { CreateFinePayload, Fine } from '@core/types/domain';

interface FineState {
  fines: Fine[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
  addFine: (payload: CreateFinePayload) => Promise<Fine>;
  updateFine: (fine: Fine) => Promise<void>;
  deleteFine: (id: string) => Promise<void>;
}

export const useFineStore = create<FineState>((set, get) => ({
  fines: [],
  isLoading: false,

  hydrate: async () => {
    set({ isLoading: true });
    const fines = await repositories.fines.getFines();
    set({ fines, isLoading: false });
  },

  addFine: async payload => {
    const fine = await repositories.fines.addFine(payload);
    const customer = await repositories.customers.getCustomerById(payload.customerId);
    if (customer) {
      await repositories.customers.updateCustomer({
        ...customer,
        fineHistory: [...customer.fineHistory, fine.id],
      });
    }
    set({ fines: [...get().fines, fine] });
    return fine;
  },

  updateFine: async fine => {
    await repositories.fines.updateFine(fine);
    set({ fines: get().fines.map(f => (f.id === fine.id ? fine : f)) });
  },

  deleteFine: async id => {
    await repositories.fines.deleteFine(id);
    set({ fines: get().fines.filter(f => f.id !== id) });
  },
}));
