import { useMemo } from 'react';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { resolveCustomerCarId } from '../helpers/resolveCustomerCarId';

export const useCustomerRentalInfo = (customerId: string) => {
  const rentals = useRentalStore(s => s.rentals);
  const cars = useCarStore(s => s.cars);

  return useMemo(() => {
    const active = rentals.find(r => r.customerId === customerId && r.status === 'ACTIVE');
    const linkedCarId = resolveCustomerCarId(customerId, rentals);
    const car = linkedCarId ? cars.find(c => c.id === linkedCarId) : undefined;
    return { activeRental: active, car, linkedCarId };
  }, [rentals, cars, customerId]);
};
