import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
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
  const { colors } = useThemeContext();
  if (payments.length === 0) {
    return <Text style={typography.bodySmall}>{t('customers.noPayments')}</Text>;
  }

  return (
    <View style={styles.list}>
      {payments.map(payment => (
        <View
          key={payment.id}
          style={[
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.main}>
            <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatPaymentHistoryDateLine(payment)}
            </Text>
            {payment.label ? (
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {payment.label}
              </Text>
            ) : null}
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
    borderRadius: radius.md,
    borderWidth: 1,
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
  },
  label: {
    ...typography.caption,
  },
});
