import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import type { Car, Fine } from '@core/types/domain';
import { formatCurrency } from '@core/utils/currency';
import { ImageSlider } from '@shared/media';
import { StatusBadge } from '@shared/ui';
import { useTranslation } from '@core/i18n';

interface CustomerFineHistoryProps {
  fines: Fine[];
  carsById: Map<string, Car>;
  onFinePress: (fineId: string) => void;
}

export const CustomerFineHistory = memo<CustomerFineHistoryProps>(
  ({ fines, carsById, onFinePress }) => {
    const { t } = useTranslation();
    if (fines.length === 0) {
      return <Text style={typography.bodySmall}>{t('customers.noFines')}</Text>;
    }

    return (
      <View style={styles.list}>
        {fines.map(fine => {
          const car = carsById.get(fine.carId);
          return (
            <Pressable
              key={fine.id}
              style={styles.card}
              onPress={() => onFinePress(fine.id)}
              accessibilityRole="button"
            >
              <View style={styles.header}>
                <Text style={styles.amount}>{formatCurrency(fine.amount)}</Text>
                <StatusBadge
                  label={fine.paidStatus ? t('common.paid') : t('common.unpaid')}
                  variant={fine.paidStatus ? 'done' : 'pending'}
                />
              </View>
              <Text style={styles.reason}>{fine.reason}</Text>
              <Text style={styles.meta}>
                {car?.name ?? t('common.car')} · {formatDate(fine.fineDate)}
              </Text>
              {fine.notes ? <Text style={styles.notes}>{fine.notes}</Text> : null}
              {fine.proofImages.length > 0 ? (
                <ImageSlider images={fine.proofImages} imageHeight={100} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amount: {
    ...typography.h4,
    color: colors.primary,
  },
  reason: {
    ...typography.body,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  notes: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
