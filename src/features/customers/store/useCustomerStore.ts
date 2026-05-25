import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { repositories } from '@core/database/repositoryRegistry';
import { zustandPersistStorage } from '@core/storage/zustandPersistStorage';
import type { CreateCustomerPayload, Customer } from '@core/types/domain';

export type CustomerFilter = 'PENDING' | 'DONE' | 'ACTIVE_RENTALS' | 'BLACKLISTED' | 'ALL';

interface CustomerState {
  customers: Customer[];
  filter: CustomerFilter;
  searchQuery: string;
  isLoading: boolean;
  setFilter: (filter: CustomerFilter) => void;
  setSearchQuery: (query: string) => void;
  hydrate: () => Promise<void>;
  addCustomer: (payload: CreateCustomerPayload) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      filter: 'PENDING',
      searchQuery: '',
      isLoading: false,

      setFilter: filter => set({ filter }),
      setSearchQuery: searchQuery => set({ searchQuery }),

      hydrate: async () => {
        set({ isLoading: true });
        const customers = await repositories.customers.getCustomers();
        set({ customers, isLoading: false });
      },

      addCustomer: async payload => {
        const customer = await repositories.customers.addCustomer(payload);
        set({ customers: [...get().customers, customer] });
        return customer;
      },

      updateCustomer: async customer => {
        await repositories.customers.updateCustomer(customer);
        set({
          customers: get().customers.map(c => (c.id === customer.id ? customer : c)),
        });
      },

      deleteCustomer: async id => {
        await repositories.customers.deleteCustomer(id);
        set({ customers: get().customers.filter(c => c.id !== id) });
      },

      getCustomerById: id => get().customers.find(c => c.id === id),
    }),
    {
      name: '@rmsh/customer-store-prefs',
      storage: createJSONStorage(() => zustandPersistStorage),
      partialize: state => ({ filter: state.filter }),
    },
  ),
);
