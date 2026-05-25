import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import { deriveCarStatus } from '@core/services/availabilityService';
import type { Car, CreateCarPayload } from '@core/types/domain';

interface CarState {
  cars: Car[];
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  addCar: (payload: CreateCarPayload) => Promise<Car>;
  updateCar: (car: Car) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  getCarById: (id: string) => Car | undefined;
}

export const useCarStore = create<CarState>((set, get) => ({
  cars: [],
  isLoading: false,
  error: null,

  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const [cars, rentals] = await Promise.all([
        repositories.cars.getCars(),
        repositories.rentals.getRentals(),
      ]);
      const enriched = cars.map(car => ({
        ...car,
        status: deriveCarStatus(car, rentals),
        currentBooking: rentals.find(
          r => r.carId === car.id && (r.status === 'ACTIVE' || r.status === 'UPCOMING'),
        ),
        futureBookings: rentals.filter(
          r => r.carId === car.id && r.status === 'UPCOMING',
        ),
      }));
      set({ cars: enriched, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  addCar: async payload => {
    const car = await repositories.cars.addCar(payload);
    set({ cars: [...get().cars, car] });
    return car;
  },

  updateCar: async car => {
    await repositories.cars.updateCar(car);
    set({ cars: get().cars.map(c => (c.id === car.id ? car : c)) });
  },

  deleteCar: async id => {
    await repositories.cars.deleteCar(id);
    set({ cars: get().cars.filter(c => c.id !== id) });
  },

  getCarById: id => get().cars.find(c => c.id === id),
}));
