import { useCallback, useState } from 'react';
import { usePaymentStore } from '../store/usePaymentStore';

export const usePaymentInstallmentActions = () => {
  const markPaymentReceived = usePaymentStore(s => s.markPaymentReceived);
  const [actingId, setActingId] = useState<string | undefined>();
  const [bulkActingIds, setBulkActingIds] = useState<string[]>([]);

  const runReceived = useCallback(
    async (paymentId: string) => {
      setActingId(paymentId);
      try {
        await markPaymentReceived(paymentId);
      } finally {
        setActingId(undefined);
      }
    },
    [markPaymentReceived],
  );

  const runBulkReceived = useCallback(
    async (paymentIds: string[]) => {
      const uniqueIds = Array.from(new Set(paymentIds));
      if (uniqueIds.length === 0) {
        return;
      }

      setBulkActingIds(uniqueIds);
      try {
        for (const paymentId of uniqueIds) {
          await markPaymentReceived(paymentId);
        }
      } finally {
        setBulkActingIds([]);
      }
    },
    [markPaymentReceived],
  );

  return { actingId, runReceived, runBulkReceived, bulkActingIds };
};
