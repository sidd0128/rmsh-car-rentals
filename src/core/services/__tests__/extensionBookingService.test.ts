import {
  canOfferExtensionUi,
  findNextCarRental,
  getExtensionAvailability,
  validateExtensionEndDate,
} from '../extensionBookingService';
import type { Rental } from '../../types/domain';

const rental = (overrides: Partial<Rental>): Rental => ({
  id: 'sid',
  carId: 'bmw',
  customerId: 'sid-id',
  startDate: '2026-03-01',
  endDate: '2026-05-26',
  agreedPrice: 5000,
  paymentStatus: 'PENDING',
  status: 'ACTIVE',
  billingFrequency: 'WEEKLY',
  rateAmount: 200,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

describe('extensionBookingService', () => {
  const sid = rental({ id: 'sid' });

  it('allows extension through the day before the next booking', () => {
    const next = rental({
      id: 'next',
      customerId: 'other',
      startDate: '2026-06-15',
      endDate: '2026-07-01',
      status: 'UPCOMING',
    });
    const availability = getExtensionAvailability(sid, [sid, next]);
    expect(availability.canExtend).toBe(true);
    expect(availability.maxEndDate?.format('YYYY-MM-DD')).toBe('2026-06-14');
  });

  it('blocks extension when the next booking starts too soon (28 May)', () => {
    const next = rental({
      id: 'next',
      customerId: 'other',
      startDate: '2026-05-28',
      endDate: '2026-06-30',
      status: 'UPCOMING',
    });
    const availability = getExtensionAvailability(sid, [sid, next]);
    expect(availability.canExtend).toBe(false);
    expect(availability.blockingRental?.id).toBe('next');
  });

  it('validates new end date within the available window', () => {
    const next = rental({
      id: 'next',
      startDate: '2026-06-15',
      endDate: '2026-07-01',
      status: 'UPCOMING',
    });
    expect(validateExtensionEndDate(sid, [sid, next], '2026-06-14').ok).toBe(true);
    expect(validateExtensionEndDate(sid, [sid, next], '2026-06-15').ok).toBe(false);
  });

  it('offers extension UI only when billing and calendar allow', () => {
    const next = rental({
      id: 'next',
      startDate: '2026-06-15',
      endDate: '2026-07-01',
      status: 'UPCOMING',
    });
    expect(canOfferExtensionUi(sid, [sid, next])).toBe(true);

    const tooSoon = rental({
      id: 'soon',
      startDate: '2026-05-28',
      endDate: '2026-06-30',
      status: 'UPCOMING',
    });
    expect(canOfferExtensionUi(sid, [sid, tooSoon])).toBe(false);
  });

  it('finds the earliest next rental after current end', () => {
    const later = rental({
      id: 'later',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
    });
    const sooner = rental({
      id: 'sooner',
      startDate: '2026-06-15',
      endDate: '2026-06-30',
    });
    expect(findNextCarRental(sid, [sid, later, sooner])?.id).toBe('sooner');
  });
});
