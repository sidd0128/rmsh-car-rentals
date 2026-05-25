import { hasBookingConflict } from '../src/core/services/bookingConflictService';

test('booking conflict service is available', () => {
  expect(hasBookingConflict([], {
    startDate: '2026-01-01',
    endDate: '2026-01-05',
  })).toBe(false);
});
