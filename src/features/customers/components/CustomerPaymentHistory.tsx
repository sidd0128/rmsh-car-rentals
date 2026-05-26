import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, spacing, typography } from '@app/theme';
import {
  formatPaymentHistoryDateLine,
  formatPaymentStatusLabel,
  paymentStatusToBadgeVariant,
} from '@core/helpers/paymentInstallment';
import type { PaymentRecord } from '@core/types/domain';
import { formatCurrency } from '@core/utils/currency';
import { StatusBadge } from '@shared/ui';
import { useTranslation } from '@core/i18n';

interface CustomerPaymentHistoryProps {
  payments: PaymentRecord[];
}

export const CustomerPaymentHistory = memo<CustomerPaymentHistoryProps>(({ payments }) => {
  const { t } = useTranslation();
  if (payments.length === 0) {
    return <Text style={typography.bodySmall}>{t('customers.noPayments')}</Text>;
  }

  return (
    <View style={styles.list}>
      {payments.map(payment => (
        <View key={payment.id} style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
            <Text style={styles.date}>{formatPaymentHistoryDateLine(payment)}</Text>
            {payment.label ? <Text style={styles.label}>{payment.label}</Text> : null}
          </View>
          <StatusBadge
            label={formatPaymentStatusLabel(payment.status)}
            variant={paymentStatusToBadgeVariant(payment.status)}
          />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  main: {
    flex: 1,
    gap: spacing.xxs,
  },
  amount: {
    ...typography.body,
    fontWeight: '600',
  },
  date: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
