import type { BookingRequest } from '@core/types/domain';

export const getPendingBookingRequests = (
  bookingRequests: BookingRequest[],
): BookingRequest[] =>
  bookingRequests.filter(request => request.status === 'PENDING');

export const getPendingBookingRequestCount = (
  bookingRequests: BookingRequest[],
): number => getPendingBookingRequests(bookingRequests).length;

export const sortBookingRequestsByNewest = (
  bookingRequests: BookingRequest[],
): BookingRequest[] =>
  [...bookingRequests].sort(
    (a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  );
