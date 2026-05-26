import type { AccidentRecord, CreateAccidentPayload } from '@core/types/domain';

export interface IAccidentRepository {
  getAccidents(): Promise<AccidentRecord[]>;
  addAccident(payload: CreateAccidentPayload): Promise<AccidentRecord>;
}
