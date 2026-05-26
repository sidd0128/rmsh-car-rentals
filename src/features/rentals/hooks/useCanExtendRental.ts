import { useMemo } from 'react';
import { canOfferExtensionUi } from '@core/services/extensionBookingService';
import type { Rental } from '@core/types/domain';
import { useRentalStore } from '../store/useRentalStore';

export const useCanExtendRental = (rental: Rental | undefined): boolean => {
  const rentals = useRentalStore(s => s.rentals);
  return useMemo(
    () => (rental ? canOfferExtensionUi(rental, rentals) : false),
    [rental, rentals],
  );
};
