import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import {
  deriveCarStatus,
  resolveCurrentBookingForCar,
  resolveFutureBookingsForCar,
} from '@core/services/availabilityService';
import type { Car, CreateCarPayload } from '@core/types/domain';

interface CarState {
  cars: Car[];
  hydrate: () => Promise<void>;
  addCar: (payload: CreateCarPayload) => Promise<Car>;
  updateCar: (car: Car) => Promise<void>;
  getCarById: (id: string) => Car | undefined;
}

export const useCarStore = create<CarState>((set, get) => ({
  cars: [],

  hydrate: async () => {
    const [cars, rentals] = await Promise.all([
      repositories.cars.getCars(),
      repositories.rentals.getRentals(),
    ]);
    const enriched = cars.map(car => ({
      ...car,
      status: deriveCarStatus(car, rentals),
      currentBooking: resolveCurrentBookingForCar(car.id, rentals),
      futureBookings: resolveFutureBookingsForCar(car.id, rentals),
    }));
    set({ cars: enriched });
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

  getCarById: id => get().cars.find(c => c.id === id),
}));
