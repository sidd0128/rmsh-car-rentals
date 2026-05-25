import type { CreateFinePayload, Fine } from '@core/types/domain';

export interface IFineRepository {
  getFines(): Promise<Fine[]>;
  getFineById(id: string): Promise<Fine | undefined>;
  getFinesByCustomerId(customerId: string): Promise<Fine[]>;
  getFinesByCarId(carId: string): Promise<Fine[]>;
  addFine(payload: CreateFinePayload): Promise<Fine>;
  updateFine(fine: Fine): Promise<void>;
  deleteFine(id: string): Promise<void>;
}
