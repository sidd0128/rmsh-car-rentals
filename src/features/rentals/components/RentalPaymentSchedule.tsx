import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { formatInstallmentDueLabel } from '@core/helpers/paymentInstallment';
import type { PaymentRecord, Rental } from '@core/types/domain';
import { billingFrequencyLabel, formatRentDueDaySummary } from '@core/services/rentalBillingService';
import { formatCurrency } from '@core/utils/currency';
import type { PaymentInstallmentAction } from '@core/helpers/paymentInstallment';
import { PaymentInstallmentActions } from '@shared/ui';

interface RentalPaymentScheduleProps {
  rental: Rental;
  payments: PaymentRecord[];
  onMarkReceived: (paymentId: string) => void;
  onMarkNotPaid: (paymentId: string) => void;
  markingId?: string;
  markingAction?: PaymentInstallmentAction;
}

export const RentalPaymentSchedule = memo<RentalPaymentScheduleProps>(
  ({ rental, payments, onMarkReceived, onMarkNotPaid, markingId, markingAction }) => {
    if (payments.length === 0) {
      return (
        <Text style={typography.bodySmall}>No payment schedule recorded for this rental.</Text>
      );
    }

    const paid = payments.filter(p => p.status === 'DONE').length;
    const notPaid = payments.filter(p => p.status === 'NOT_PAID').length;

    return (
      <View style={styles.wrap}>
        {rental.billingFrequency ? (
          <Text style={styles.summary}>
            {billingFrequencyLabel(rental.billingFrequency)}
            {rental.rateAmount != null ? ` · ${formatCurrency(rental.rateAmount)}` : ''}
            {' · '}
            {formatRentDueDaySummary(
              rental.billingFrequency,
              rental.rentDueWeekday,
              rental.rentDueDayOfMonth,
            )}
          </Text>
        ) : null}
        <Text style={styles.summary}>
          {paid} of {payments.length} received
          {notPaid > 0 ? ` · ${notPaid} not paid` : ''}
        </Text>

        {payments.map(payment => (
          <View key={payment.id} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>
                {payment.label ?? `Payment ${payment.installmentIndex ?? 1}`}
              </Text>
              <Text style={styles.rowDue}>{formatInstallmentDueLabel(payment)}</Text>
              {payment.periodEnd && payment.periodStart !== payment.periodEnd ? (
                <Text style={styles.rowMeta}>
                  Period {formatDate(payment.periodStart!)} – {formatDate(payment.periodEnd)}
                </Text>
              ) : null}
              <Text style={styles.rowAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
            <PaymentInstallmentActions
              status={payment.status}
              paymentId={payment.id}
              actingId={markingId}
              actingKind={markingAction}
              onReceived={onMarkReceived}
              onNotPaid={onMarkNotPaid}
            />
            {payment.status === 'DONE' ? (
              <Text style={styles.paidTag}>Received</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  summary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowBody: { gap: spacing.xxs },
  rowTitle: { ...typography.h4 },
  rowDue: { ...typography.label, color: colors.primary },
  rowMeta: { ...typography.caption, color: colors.textMuted },
  rowAmount: { ...typography.body, fontWeight: '600', marginTop: spacing.xs },
  paidTag: {
    ...typography.label,
    color: colors.success,
    alignSelf: 'flex-start',
  },
});
