import type { CreateRentalPayload, Rental } from '@core/types/domain';

export interface IRentalRepository {
  getRentals(): Promise<Rental[]>;
  getRentalById(id: string): Promise<Rental | undefined>;
  getRentalsByCarId(carId: string): Promise<Rental[]>;
  addRental(payload: CreateRentalPayload): Promise<Rental>;
  updateRental(rental: Rental): Promise<void>;
  deleteRental(id: string): Promise<void>;
}
