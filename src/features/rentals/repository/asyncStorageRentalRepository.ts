import { BaseLocalRepository } from '@core/database/baseRepository';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { CreateRentalPayload, Rental } from '@core/types/domain';
import type { IRentalRepository } from './IRentalRepository';

class AsyncStorageRentalRepository
  extends BaseLocalRepository<Rental>
  implements IRentalRepository
{
  constructor() {
    super(STORAGE_KEYS.RENTALS);
  }

  getRentals(): Promise<Rental[]> {
    return this.getAll();
  }

  getRentalById(id: string): Promise<Rental | undefined> {
    return this.getById(id);
  }

  async getRentalsByCarId(carId: string): Promise<Rental[]> {
    return (await this.getAll()).filter(r => r.carId === carId);
  }

  async getRentalsByCustomerId(customerId: string): Promise<Rental[]> {
    return (await this.getAll()).filter(r => r.customerId === customerId);
  }

  async addRental(payload: CreateRentalPayload): Promise<Rental> {
    const now = todayISO();
    const rental: Rental = {
      ...payload,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.save(rental);
    return rental;
  }

  async updateRental(rental: Rental): Promise<void> {
    await this.save({ ...rental, updatedAt: todayISO() });
  }

  deleteRental(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const asyncStorageRentalRepository = new AsyncStorageRentalRepository();
