import { BaseLocalRepository } from '@core/database/baseRepository';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type {
  CreateDeletionAuditLogPayload,
  DeletionAuditLog,
} from '@core/types/domain';
import type { IDeletionAuditLogRepository } from './IDeletionAuditLogRepository';

class AsyncStorageDeletionAuditLogRepository
  extends BaseLocalRepository<DeletionAuditLog>
  implements IDeletionAuditLogRepository
{
  constructor() {
    super(STORAGE_KEYS.DELETION_AUDIT_LOGS);
  }

  getDeletionAuditLogs(): Promise<DeletionAuditLog[]> {
    return this.getAll();
  }

  async addDeletionAuditLog(
    payload: CreateDeletionAuditLogPayload,
  ): Promise<DeletionAuditLog> {
    const now = todayISO();
    const log: DeletionAuditLog = {
      ...payload,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.save(log);
    return log;
  }
}

export const asyncStorageDeletionAuditLogRepository =
  new AsyncStorageDeletionAuditLogRepository();
