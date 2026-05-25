import { useCallback } from 'react';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';

export const useHydrateStores = () => {
  const hydrateAll = useCallback(async () => {
    await Promise.all([
      useCarStore.getState().hydrate(),
      useCustomerStore.getState().hydrate(),
      useRentalStore.getState().hydrate(),
      useFineStore.getState().hydrate(),
      useAccidentStore.getState().hydrate(),
      usePaymentStore.getState().hydrate(),
    ]);
  }, []);

  return { hydrateAll };
};
