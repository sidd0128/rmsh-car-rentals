import dayjs from 'dayjs';
import type { Car, Customer, PaymentRecord, Rental } from '@core/types/domain';
import { formatDate } from '@core/helpers/date';
import { paidAmountForRental } from '@core/helpers/rentalPayments';

export interface RentalEarningRow {
  rentalId: string;
  customerName: string;
  customerInitials: string;
  periodLabel: string;
  agreedPrice: number;
  paidAmount: number;
  paymentStatus: Rental['paymentStatus'];
}

export interface CarEarningsSection {
  carId: string;
  carName: string;
  /** Sum of amounts customers have actually paid for this car's rentals */
  totalPaid: number;
  /** Sum of agreed rental prices (all hires) */
  totalAgreed: number;
  /** Amount still outstanding (agreed − paid) */
  totalPending: number;
  hireCount: number;
  rentals: RentalEarningRow[];
}

const customerInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const buildCarEarningsSections = (
  cars: Car[],
  rentals: Rental[],
  customers: Customer[],
  payments: PaymentRecord[],
): CarEarningsSection[] => {
  const customerNameById = new Map(customers.map(c => [c.id, c.name]));

  return cars
    .map(car => {
      const carRentals = rentals
        .filter(r => r.carId === car.id)
        .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf());

      const rentalRows: RentalEarningRow[] = carRentals.map(rental => {
        const customerName = customerNameById.get(rental.customerId) ?? 'Unknown customer';
        return {
          rentalId: rental.id,
          customerName,
          customerInitials: customerInitials(customerName),
          periodLabel: `${formatDate(rental.startDate)} – ${formatDate(rental.endDate)}`,
          agreedPrice: rental.agreedPrice,
          paidAmount: paidAmountForRental(rental, payments),
          paymentStatus: rental.paymentStatus,
        };
      });

      const totalPaid = rentalRows.reduce((sum, row) => sum + row.paidAmount, 0);
      const totalAgreed = rentalRows.reduce((sum, row) => sum + row.agreedPrice, 0);

      return {
        carId: car.id,
        carName: car.name,
        totalPaid,
        totalAgreed,
        totalPending: Math.max(0, totalAgreed - totalPaid),
        hireCount: rentalRows.length,
        rentals: rentalRows,
      };
    })
    .filter(section => section.hireCount > 0)
    .sort((a, b) => b.totalPaid - a.totalPaid);
};
