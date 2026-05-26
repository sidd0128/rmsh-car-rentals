import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, typography } from '@app/theme';
import type { PaymentInstallmentAction } from '@core/helpers/paymentInstallment';
import type { PaymentRecord } from '@core/types/domain';
import { useTranslation } from '@core/i18n';
import { AppButton } from './AppButton';

interface PaymentInstallmentActionsProps {
  status: PaymentRecord['status'];
  paymentId: string;
  actingId?: string;
  actingKind?: PaymentInstallmentAction;
  onReceived: (paymentId: string) => void;
  onNotPaid: (paymentId: string) => void;
}

export const PaymentInstallmentActions = memo<PaymentInstallmentActionsProps>(
  ({ status, paymentId, actingId, actingKind, onReceived, onNotPaid }) => {
    const { t } = useTranslation();

    if (status === 'DONE') {
      return null;
    }

    const busy = actingId === paymentId;

    if (status === 'NOT_PAID') {
      return (
        <View style={styles.stacked}>
          <Text style={styles.notPaidTag}>{t('common.notPaid')}</Text>
          <AppButton
            label={t('common.received')}
            onPress={() => onReceived(paymentId)}
            loading={busy && actingKind === 'received'}
            fullWidth
            style={styles.btn}
          />
        </View>
      );
    }

    return (
      <View style={styles.row}>
        <AppButton
          label={t('common.received')}
          onPress={() => onReceived(paymentId)}
          loading={busy && actingKind === 'received'}
          style={styles.btn}
        />
        <AppButton
          label={t('common.notPaid')}
          variant="outline"
          onPress={() => onNotPaid(paymentId)}
          loading={busy && actingKind === 'not_paid'}
          style={styles.btn}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stacked: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    marginVertical: 0,
  },
  notPaidTag: {
    ...typography.label,
    color: colors.error,
  },
});
