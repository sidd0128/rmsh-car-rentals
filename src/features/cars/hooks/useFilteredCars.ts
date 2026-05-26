import { useMemo } from 'react';
import {
  carHasUpcomingBookingOnly,
  carIsReturningSoon,
} from '@core/services/availabilityService';
import { useDebouncedValue } from '@reusable';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useCarStore } from '../store/useCarStore';
import { useCarFilterStore, type CarFilter } from '../store/useCarFilterStore';
import type { Car } from '@core/types/domain';
import type { Rental } from '@core/types/domain';

const matchesSearch = (car: Car, query: string): boolean => {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    car.name.toLowerCase().includes(q) ||
    car.model.toLowerCase().includes(q) ||
    car.numberPlate.toLowerCase().includes(q) ||
    car.brand.toLowerCase().includes(q)
  );
};

const matchesFilter = (car: Car, filter: CarFilter, rentals: Rental[]): boolean => {
  if (filter === 'ALL') return true;
  if (filter === 'UPCOMING_BOOKING') {
    return carHasUpcomingBookingOnly(car, rentals);
  }
  if (filter === 'RETURNING_SOON') {
    return carIsReturningSoon(car, rentals);
  }
  return car.status === filter;
};

export const useFilteredCars = () => {
  const cars = useCarStore(s => s.cars);
  const rentals = useRentalStore(s => s.rentals);
  const filter = useCarFilterStore(s => s.filter);
  const searchQuery = useCarFilterStore(s => s.searchQuery);
  const debouncedSearch = useDebouncedValue(searchQuery);

  return useMemo(
    () =>
      cars.filter(
        c => matchesFilter(c, filter, rentals) && matchesSearch(c, debouncedSearch),
      ),
    [cars, rentals, filter, debouncedSearch],
  );
};
