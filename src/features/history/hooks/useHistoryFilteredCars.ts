import { useMemo } from 'react';
import { useDebouncedValue } from '@reusable';
import { useCarStore } from '@features/cars/store/useCarStore';
import type { Car } from '@core/types/domain';

const matchesSearch = (car: Car, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    car.name.toLowerCase().includes(q) ||
    car.model.toLowerCase().includes(q) ||
    car.numberPlate.toLowerCase().includes(q) ||
    car.brand.toLowerCase().includes(q)
  );
};

export const useHistoryFilteredCars = (searchQuery: string): Car[] => {
  const cars = useCarStore(s => s.cars);
  const debounced = useDebouncedValue(searchQuery, 200);

  return useMemo(
    () =>
      [...cars]
        .filter(c => matchesSearch(c, debounced))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [cars, debounced],
  );
};
