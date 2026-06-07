import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDate } from '@core/helpers/date';
import type { Car, Fine } from '@core/types/domain';
import { formatCurrency } from '@core/utils/currency';
import { ImageSlider } from '@shared/media';
import { StatusBadge } from '@shared/ui';
import { useTranslation } from '@core/i18n';

type FineHistoryEmptyScope = 'customer' | 'car';

interface CustomerFineHistoryProps {
  fines: Fine[];
  carsById: Map<string, Car>;
  onFinePress: (fineId: string) => void;
  /** Car detail vs customer profile empty-state copy. */
  emptyScope?: FineHistoryEmptyScope;
}

export const CustomerFineHistory = memo<CustomerFineHistoryProps>(
  ({ fines, carsById, onFinePress, emptyScope = 'customer' }) => {
    const { t } = useTranslation();
    const { colors } = useThemeContext();
    if (fines.length === 0) {
      const emptyKey =
        emptyScope === 'car' ? 'cars.noFinesForCar' : 'customers.noFines';
      return <Text style={typography.bodySmall}>{t(emptyKey)}</Text>;
    }

    return (
      <View style={styles.list}>
        {fines.map(fine => {
          const car = carsById.get(fine.carId);
          return (
            <Pressable
              key={fine.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.borderLight },
              ]}
              onPress={() => onFinePress(fine.id)}
              accessibilityRole="button"
            >
              <View style={styles.header}>
                <Text style={[styles.amount, { color: colors.primary }]}>
                  {formatCurrency(fine.amount)}
                </Text>
                <StatusBadge
                  label={fine.paidStatus ? t('common.paid') : t('common.unpaid')}
                  variant={fine.paidStatus ? 'done' : 'pending'}
                />
              </View>
              <Text style={styles.reason}>{fine.reason}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {car?.name ?? t('common.car')} · {formatDate(fine.fineDate)}
              </Text>
              {fine.notes ? (
                <Text style={[styles.notes, { color: colors.textMuted }]}>
                  {fine.notes}
                </Text>
              ) : null}
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
    borderRadius: radius.md,
    borderWidth: 1,
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
  },
  reason: {
    ...typography.body,
  },
  meta: {
    ...typography.bodySmall,
  },
  notes: {
    ...typography.caption,
  },
});
