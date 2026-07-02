import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import type { DeletionAuditLog } from '@core/types/domain';

interface DeletionAuditLogState {
  logs: DeletionAuditLog[];
  hydrate: () => Promise<void>;
}

export const useDeletionAuditLogStore = create<DeletionAuditLogState>(set => ({
  logs: [],

  hydrate: async () => {
    const logs = await repositories.deletionAuditLogs.getDeletionAuditLogs();
    set({
      logs: [...logs].sort(
        (a, b) =>
          new Date(b.deletedAt).valueOf() - new Date(a.deletedAt).valueOf(),
      ),
    });
  },
}));
