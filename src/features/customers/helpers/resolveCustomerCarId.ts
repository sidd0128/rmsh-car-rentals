import dayjs from 'dayjs';
import type { Rental } from '@core/types/domain';

/**
 * Car linked to a customer via active booking, else upcoming, else most recent rental.
 */
export const resolveCustomerCarId = (
  customerId: string,
  rentals: Rental[],
): string | undefined => {
  const customerRentals = rentals.filter(r => r.customerId === customerId);
  const active = customerRentals.find(r => r.status === 'ACTIVE');
  if (active) {
    return active.carId;
  }

  const upcoming = customerRentals.find(r => r.status === 'UPCOMING');
  if (upcoming) {
    return upcoming.carId;
  }

  const sorted = [...customerRentals].sort(
    (a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf(),
  );
  return sorted[0]?.carId;
};
