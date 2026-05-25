import type { AccidentRecord, CreateAccidentPayload } from '@core/types/domain';

export interface IAccidentRepository {
  getAccidents(): Promise<AccidentRecord[]>;
  getAccidentById(id: string): Promise<AccidentRecord | undefined>;
  getAccidentsByCustomerId(customerId: string): Promise<AccidentRecord[]>;
  getAccidentsByCarId(carId: string): Promise<AccidentRecord[]>;
  addAccident(payload: CreateAccidentPayload): Promise<AccidentRecord>;
  updateAccident(record: AccidentRecord): Promise<void>;
  deleteAccident(id: string): Promise<void>;
}
