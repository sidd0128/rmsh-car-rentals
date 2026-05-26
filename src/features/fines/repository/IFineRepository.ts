import type { CreateFinePayload, Fine } from '@core/types/domain';

export interface IFineRepository {
  getFines(): Promise<Fine[]>;
  addFine(payload: CreateFinePayload): Promise<Fine>;
  updateFine(fine: Fine): Promise<void>;
  deleteFine(id: string): Promise<void>;
}
