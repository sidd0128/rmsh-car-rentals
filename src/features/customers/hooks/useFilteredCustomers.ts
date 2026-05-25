import { useMemo } from 'react';
import { useDebounce } from '@core/hooks/useDebounce';
import { useCustomerStore, type CustomerFilter } from '../store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import type { Customer } from '@core/types/domain';

export const useFilteredCustomers = () => {
  const customers = useCustomerStore(s => s.customers);
  const filter = useCustomerStore(s => s.filter);
  const searchQuery = useCustomerStore(s => s.searchQuery);
  const rentals = useRentalStore(s => s.rentals);
  const debouncedSearch = useDebounce(searchQuery);

  return useMemo(() => {
    let result = [...customers];

    if (filter === 'BLACKLISTED') {
      result = result.filter(c => c.isBlacklisted);
    } else if (filter === 'ACTIVE_RENTALS') {
      const activeCustomerIds = new Set(
        rentals.filter(r => r.status === 'ACTIVE').map(r => r.customerId),
      );
      result = result.filter(c => activeCustomerIds.has(c.id));
    } else if (filter === 'PENDING' || filter === 'DONE') {
      result = result.filter(c => {
        const customerRentals = rentals.filter(r => r.customerId === c.id);
        const hasPending = customerRentals.some(r => r.paymentStatus === 'PENDING');
        return filter === 'PENDING' ? hasPending : !hasPending;
      });
    }

    const q = debouncedSearch.toLowerCase().trim();
    if (q) {
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.address.toLowerCase().includes(q),
      );
    }

    return result;
  }, [customers, filter, debouncedSearch, rentals]);
};

export const useCustomerRentalInfo = (customerId: string) => {
  const rentals = useRentalStore(s => s.rentals);
  const cars = useCarStore(s => s.cars);

  return useMemo(() => {
    const active = rentals.find(r => r.customerId === customerId && r.status === 'ACTIVE');
    const car = active ? cars.find(c => c.id === active.carId) : undefined;
    return { activeRental: active, car };
  }, [rentals, cars, customerId]);
};
