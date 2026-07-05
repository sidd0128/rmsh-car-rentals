import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import { cancelUpcomingRental as cancelUpcomingRentalService } from '@core/services/cancelUpcomingRentalService';
import { createScheduledRental } from '@core/services/rentalScheduleService';
import { updateRentalEndDate as updateRentalEndDateService } from '@core/services/updateRentalEndDateService';
import {
  updateRentalRentDueDay as updateRentalRentDueDayService,
  type UpdateRentalRentDueDayInput,
} from '@core/services/updateRentalRentDueDayService';
import type { Rental } from '@core/types/domain';
import { useCarStore } from '@features/cars/store/useCarStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import type { AssignRentalInput } from '../types/assignRental';

interface RentalState {
  rentals: Rental[];
  hydrate: () => Promise<void>;
  assignRental: (
    input: AssignRentalInput,
  ) => Promise<{ success: boolean; error?: string }>;
  cancelUpcomingRental: (
    rentalId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  setRentalEndDate: (
    rentalId: string,
    endDate: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateRentalRentDueDay: (
    rentalId: string,
    input: UpdateRentalRentDueDayInput,
  ) => Promise<{ success: boolean; error?: string }>;
}

const refreshAfterRentalChange = async (
  set: (partial: Partial<RentalState>) => void,
): Promise<void> => {
  const rentals = await repositories.rentals.getRentals();
  set({ rentals });
  await useCarStore.getState().hydrate();
  await usePaymentStore.getState().hydrate();
};

export const useRentalStore = create<RentalState>(set => ({
  rentals: [],

  hydrate: async () => {
    const rentals = await repositories.rentals.getRentals();
    set({ rentals });
  },

  assignRental: async input => {
    const result = await createScheduledRental(input);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    await refreshAfterRentalChange(set);
    return { success: true };
  },

  cancelUpcomingRental: async rentalId => {
    const result = await cancelUpcomingRentalService(rentalId);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    await refreshAfterRentalChange(set);
    return { success: true };
  },

  setRentalEndDate: async (rentalId, endDate) => {
    const result = await updateRentalEndDateService(rentalId, endDate);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    await refreshAfterRentalChange(set);
    return { success: true };
  },

  updateRentalRentDueDay: async (rentalId, input) => {
    const result = await updateRentalRentDueDayService(rentalId, input);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    await refreshAfterRentalChange(set);
    return { success: true };
  },
}));
