import type { BookingRequest } from '@core/types/domain';

export interface IBookingRequestRepository {
  getBookingRequests: () => Promise<BookingRequest[]>;
  getBookingRequestById: (id: string) => Promise<BookingRequest | undefined>;
  saveBookingRequest: (request: BookingRequest) => Promise<void>;
  replaceAll: (requests: BookingRequest[]) => Promise<void>;
}
