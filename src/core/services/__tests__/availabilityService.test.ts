import dayjs from 'dayjs';
import {
  carHasUpcomingBookingOnly,
  carIsReturningSoon,
  deriveCarStatus,
  rentalIsReturningSoon,
  resolveCurrentBookingForCar,
  resolveNextUpcomingBookingForCar,
} from '../availabilityService';
import type { Car, Rental } from '@core/types/domain';

const car = (id: string): Car => ({
  id,
  name: 'Test',
  brand: 'B',
  model: 'M',
  year: 2024,
  color: 'Black',
  numberPlate: 'X',
  status: 'AVAILABLE',
  images: [],
  priceConfigurations: [],
  futureBookings: [],
  totalEarnings: 0,
  createdAt: '',
  updatedAt: '',
});

const rental = (overrides: Partial<Rental> & Pick<Rental, 'id' | 'carId'>): Rental =>
  ({
    customerId: 'c1',
    startDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
    agreedPrice: 100,
    paymentStatus: 'PENDING',
    status: 'UPCOMING',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }) as Rental;

describe('availabilityService', () => {
  it('treats a car as on rent when today falls inside the contract period', () => {
    const today = dayjs().format('YYYY-MM-DD');
    const rentals = [
      rental({
        id: 'r1',
        carId: 'car1',
        startDate: today,
        endDate: dayjs().add(5, 'day').format('YYYY-MM-DD'),
        status: 'UPCOMING',
      }),
    ];
    expect(resolveCurrentBookingForCar('car1', rentals)?.id).toBe('r1');
    expect(deriveCarStatus(car('car1'), rentals)).toBe('ON_RENT');
    expect(carHasUpcomingBookingOnly(car('car1'), rentals)).toBe(false);
  });

  it('lists upcoming booking only when start is in the future and car is not on rent', () => {
    const rentals = [
      rental({
        id: 'r1',
        carId: 'car1',
        startDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().add(20, 'day').format('YYYY-MM-DD'),
        status: 'UPCOMING',
      }),
    ];
    expect(resolveNextUpcomingBookingForCar('car1', rentals)?.id).toBe('r1');
    expect(deriveCarStatus(car('car1'), rentals)).toBe('UPCOMING_BOOKING');
    expect(carHasUpcomingBookingOnly(car('car1'), rentals)).toBe(true);
  });

  it('excludes on-rent cars even when a later booking exists', () => {
    const today = dayjs().format('YYYY-MM-DD');
    const rentals = [
      rental({
        id: 'active',
        carId: 'car1',
        startDate: today,
        endDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        status: 'ACTIVE',
      }),
      rental({
        id: 'future',
        carId: 'car1',
        startDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().add(20, 'day').format('YYYY-MM-DD'),
        status: 'UPCOMING',
      }),
    ];
    expect(deriveCarStatus(car('car1'), rentals)).toBe('ON_RENT');
    expect(carHasUpcomingBookingOnly(car('car1'), rentals)).toBe(false);
    expect(resolveNextUpcomingBookingForCar('car1', rentals)).toBeUndefined();
  });

  it('flags returning soon when active rental ends within three days', () => {
    const today = dayjs().format('YYYY-MM-DD');
    const rentals = [
      rental({
        id: 'r1',
        carId: 'car1',
        startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
        status: 'ACTIVE',
      }),
    ];
    expect(rentalIsReturningSoon(rentals[0])).toBe(true);
    expect(carIsReturningSoon(car('car1'), rentals)).toBe(true);
  });

  it('excludes cars whose active rental ends later than three days', () => {
    const rentals = [
      rental({
        id: 'r1',
        carId: 'car1',
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
        status: 'ACTIVE',
      }),
    ];
    expect(carIsReturningSoon(car('car1'), rentals)).toBe(false);
  });
});
