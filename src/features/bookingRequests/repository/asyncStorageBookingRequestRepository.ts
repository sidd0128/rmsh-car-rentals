import { BaseLocalRepository } from '@core/database/baseRepository';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { BookingRequest } from '@core/types/domain';
import type { IBookingRequestRepository } from './IBookingRequestRepository';

class AsyncStorageBookingRequestRepository
  extends BaseLocalRepository<BookingRequest>
  implements IBookingRequestRepository
{
  constructor() {
    super(STORAGE_KEYS.BOOKING_REQUESTS);
  }

  getBookingRequests(): Promise<BookingRequest[]> {
    return this.getAll();
  }

  getBookingRequestById(id: string): Promise<BookingRequest | undefined> {
    return this.getById(id);
  }

  async saveBookingRequest(request: BookingRequest): Promise<void> {
    await this.save(request);
  }
}

export const asyncStorageBookingRequestRepository =
  new AsyncStorageBookingRequestRepository();
