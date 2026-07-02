import type {
  CreateDeletionAuditLogPayload,
  DeletionAuditLog,
} from '@core/types/domain';

export interface IDeletionAuditLogRepository {
  getDeletionAuditLogs(): Promise<DeletionAuditLog[]>;
  addDeletionAuditLog(
    payload: CreateDeletionAuditLogPayload,
  ): Promise<DeletionAuditLog>;
  replaceAll(logs: DeletionAuditLog[]): Promise<void>;
}
