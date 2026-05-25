import { useMemo } from 'react';
import { useDebounce } from '@core/hooks/useDebounce';
import { useCarStore } from '../store/useCarStore';
import { useCarFilterStore, type CarFilter } from '../store/useCarFilterStore';
import type { Car } from '@core/types/domain';

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

const matchesFilter = (car: Car, filter: CarFilter): boolean => {
  if (filter === 'ALL') return true;
  return car.status === filter;
};

export const useFilteredCars = () => {
  const cars = useCarStore(s => s.cars);
  const filter = useCarFilterStore(s => s.filter);
  const searchQuery = useCarFilterStore(s => s.searchQuery);
  const debouncedSearch = useDebounce(searchQuery);

  return useMemo(
    () => cars.filter(c => matchesFilter(c, filter) && matchesSearch(c, debouncedSearch)),
    [cars, filter, debouncedSearch],
  );
};
