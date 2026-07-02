import { useMemo } from 'react';
import { useDebouncedValue } from '@core/hooks/useDebouncedValue';
import { useCustomerStore } from '../store/useCustomerStore';

export const useFilteredCustomers = () => {
  const customers = useCustomerStore(s => s.customers);
  const searchQuery = useCustomerStore(s => s.searchQuery);
  const debouncedSearch = useDebouncedValue(searchQuery);

  return useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) {
      return [...customers];
    }
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }, [customers, debouncedSearch]);
};
