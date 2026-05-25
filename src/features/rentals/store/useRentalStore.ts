import { create } from 'zustand';
import dayjs from 'dayjs';
import { repositories } from '@core/database/repositoryRegistry';
import { hasBookingConflict } from '@core/services/bookingConflictService';
import { deriveCarStatus } from '@core/services/availabilityService';
import type { CreateRentalPayload, Rental } from '@core/types/domain';
import { useCarStore } from '@features/cars/store/useCarStore';

interface RentalState {
  rentals: Rental[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
  addRental: (payload: CreateRentalPayload) => Promise<Rental>;
  updateRental: (rental: Rental) => Promise<void>;
  deleteRental: (id: string) => Promise<void>;
  assignRental: (payload: CreateRentalPayload) => Promise<{ success: boolean; error?: string }>;
}

export const useRentalStore = create<RentalState>((set, get) => ({
  rentals: [],
  isLoading: false,

  hydrate: async () => {
    set({ isLoading: true });
    const rentals = await repositories.rentals.getRentals();
    set({ rentals, isLoading: false });
  },

  addRental: async payload => {
    const rental = await repositories.rentals.addRental(payload);
    set({ rentals: [...get().rentals, rental] });
    await useCarStore.getState().hydrate();
    return rental;
  },

  updateRental: async rental => {
    await repositories.rentals.updateRental(rental);
    set({ rentals: get().rentals.map(r => (r.id === rental.id ? rental : r)) });
    await useCarStore.getState().hydrate();
  },

  deleteRental: async id => {
    await repositories.rentals.deleteRental(id);
    set({ rentals: get().rentals.filter(r => r.id !== id) });
    await useCarStore.getState().hydrate();
  },

  assignRental: async payload => {
    const rentals = await repositories.rentals.getRentals();
    const carRentals = rentals.filter(r => r.carId === payload.carId);

    if (
      hasBookingConflict(carRentals, {
        startDate: payload.startDate,
        endDate: payload.endDate,
      })
    ) {
      return { success: false, error: 'Booking dates conflict with an existing rental' };
    }

    const now = dayjs();
    const status =
      now.isBefore(dayjs(payload.startDate)) ? 'UPCOMING' : 'ACTIVE';

    const rental = await get().addRental({ ...payload, status });

    const car = await repositories.cars.getCarById(payload.carId);
    if (car) {
      const updatedRentals = await repositories.rentals.getRentalsByCarId(payload.carId);
      await repositories.cars.updateCar({
        ...car,
        status: deriveCarStatus(car, updatedRentals),
        currentBooking: updatedRentals.find(r => r.status === 'ACTIVE'),
        futureBookings: updatedRentals.filter(r => r.status === 'UPCOMING'),
      });
      await useCarStore.getState().hydrate();
    }

    const payment = {
      rentalId: rental.id,
      customerId: payload.customerId,
      carId: payload.carId,
      amount: payload.agreedPrice,
      status: payload.paymentStatus,
      paidAt: payload.paymentStatus === 'DONE' ? new Date().toISOString() : undefined,
    };
    await repositories.payments.addPayment(payment);

    return { success: true };
  },
}));
