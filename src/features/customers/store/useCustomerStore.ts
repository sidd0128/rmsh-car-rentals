import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import type { CreateCustomerPayload, Customer } from '@core/types/domain';

interface CustomerState {
  customers: Customer[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hydrate: () => Promise<void>;
  addCustomer: (payload: CreateCustomerPayload) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  searchQuery: '',

  setSearchQuery: searchQuery => set({ searchQuery }),

  hydrate: async () => {
    const customers = await repositories.customers.getCustomers();
    set({ customers });
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

  getCustomerById: id => get().customers.find(c => c.id === id),
}));
