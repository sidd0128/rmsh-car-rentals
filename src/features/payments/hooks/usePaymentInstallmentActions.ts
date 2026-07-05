import { useCallback, useState } from 'react';
import type { PaymentInstallmentAction } from '@core/helpers/paymentInstallment';
import { usePaymentStore } from '../store/usePaymentStore';

export const usePaymentInstallmentActions = () => {
  const markPaymentReceived = usePaymentStore(s => s.markPaymentReceived);
  const markPaymentNotPaid = usePaymentStore(s => s.markPaymentNotPaid);
  const [actingId, setActingId] = useState<string | undefined>();
  const [actingKind, setActingKind] = useState<PaymentInstallmentAction | undefined>();
  const [bulkActingIds, setBulkActingIds] = useState<string[]>([]);

  const runAction = useCallback(
    async (paymentId: string, kind: PaymentInstallmentAction) => {
      setActingId(paymentId);
      setActingKind(kind);
      try {
        if (kind === 'received') {
          await markPaymentReceived(paymentId);
        } else {
          await markPaymentNotPaid(paymentId);
        }
      } finally {
        setActingId(undefined);
        setActingKind(undefined);
      }
    },
    [markPaymentReceived, markPaymentNotPaid],
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

  return { actingId, actingKind, runAction, runBulkReceived, bulkActingIds };
};
