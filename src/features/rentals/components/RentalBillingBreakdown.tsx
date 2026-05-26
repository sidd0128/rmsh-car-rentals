import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, spacing, typography } from '@app/theme';
import { formatInstallmentDueLabel } from '@core/helpers/paymentInstallment';
import type { RentalInstallmentDraft } from '@core/services/rentalBillingService';
import { formatCurrency } from '@core/utils/currency';

interface RentalBillingBreakdownProps {
  installments: RentalInstallmentDraft[];
  totalAmount: number;
  rentalDayCount: number;
  collectFirstOnAssignment: boolean;
}

export const RentalBillingBreakdown = memo<RentalBillingBreakdownProps>(
  ({ installments, totalAmount, rentalDayCount, collectFirstOnAssignment }) => {
    if (installments.length === 0) {
      return null;
    }

    return (
      <View style={styles.box}>
        <Text style={styles.heading}>
          {rentalDayCount} day{rentalDayCount === 1 ? '' : 's'} · {installments.length} payment
          {installments.length === 1 ? '' : 's'}
        </Text>
        {installments.map((row, index) => (
          <View key={row.index} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowDue}>
                {formatInstallmentDueLabel({
                  dueDate: row.dueDate,
                  createdAt: row.dueDate,
                })}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowAmount}>{formatCurrency(row.amount)}</Text>
              {index === 0 && collectFirstOnAssignment ? (
                <Text style={styles.advanceTag}>Due today</Text>
              ) : null}
            </View>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Contract total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  heading: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { ...typography.bodySmall, color: colors.text },
  rowDue: { ...typography.caption, color: colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowAmount: { ...typography.body, fontWeight: '600', color: colors.text },
  advanceTag: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalLabel: { ...typography.h4 },
  totalValue: { ...typography.h4, color: colors.primary },
});
