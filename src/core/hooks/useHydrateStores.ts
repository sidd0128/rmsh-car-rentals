/**
 * Loads all domain Zustand stores from repositories in parallel (call after cloud sync).
 */
import { useCallback } from 'react';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useBookingRequestStore } from '@features/bookingRequests/store/useBookingRequestStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useAppSettingsStore } from '@features/dashboard/store/useAppSettingsStore';
import { useDeletionAuditLogStore } from '@features/security/store/useDeletionAuditLogStore';

export const useHydrateStores = () => {
  const hydrateAll = useCallback(async () => {
    await Promise.all([
      useCarStore.getState().hydrate(),
      useCustomerStore.getState().hydrate(),
      useRentalStore.getState().hydrate(),
      useFineStore.getState().hydrate(),
      useAccidentStore.getState().hydrate(),
      usePaymentStore.getState().hydrate(),
      useBookingRequestStore.getState().hydrate(),
      useDeletionAuditLogStore.getState().hydrate(),
      useAppSettingsStore.getState().hydrate(),
    ]);
  }, []);

  return { hydrateAll };
};
