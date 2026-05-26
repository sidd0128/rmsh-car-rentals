import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import {
  rentalHasExtendableBilling,
  resolveExtensionValidationError,
  validateExtensionEndDate,
} from '@core/services/extensionBookingService';
import { buildExtensionAssignInput } from '../helpers/buildExtensionAssignInput';
import { createScheduledRental } from '@core/services/rentalScheduleService';
import type { Rental } from '@core/types/domain';
import { useCarStore } from '@features/cars/store/useCarStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import type { AssignRentalInput } from '../types/assignRental';
import type { ExtendRentalInput } from '../types/extendRental';

interface RentalState {
  rentals: Rental[];
  hydrate: () => Promise<void>;
  assignRental: (input: AssignRentalInput) => Promise<{ success: boolean; error?: string }>;
  extendRental: (input: ExtendRentalInput) => Promise<{ success: boolean; error?: string }>;
}

const refreshAfterRentalChange = async (
  set: (partial: Partial<RentalState>) => void,
): Promise<void> => {
  const rentals = await repositories.rentals.getRentals();
  set({ rentals });
  await useCarStore.getState().hydrate();
  await usePaymentStore.getState().hydrate();
};

export const useRentalStore = create<RentalState>((set, get) => ({
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

  extendRental: async input => {
    const source = get().rentals.find(r => r.id === input.rentalId);
    if (!source) {
      return { success: false, error: 'Rental not found' };
    }
    if (!rentalHasExtendableBilling(source)) {
      return {
        success: false,
        error: 'This rental uses a legacy contract and cannot be extended here',
      };
    }

    const rentals = get().rentals;
    const validation = validateExtensionEndDate(source, rentals, input.newEndDate);
    if (!validation.ok) {
      const customers = await repositories.customers.getCustomers();
      const name =
        validation.blockingRental
          ? customers.find(c => c.id === validation.blockingRental!.customerId)?.name ??
            'another customer'
          : 'another customer';
      return {
        success: false,
        error: resolveExtensionValidationError(validation, name),
      };
    }

    const assignInput = buildExtensionAssignInput(
      source,
      input.newEndDate,
      input.collectFirstPaymentOnExtension,
    );

    const result = await createScheduledRental(assignInput, {
      excludeConflictRentalId: source.id,
    });
    if (!result.success) {
      return { success: false, error: result.error };
    }

    await refreshAfterRentalChange(set);
    return { success: true };
  },
}));
