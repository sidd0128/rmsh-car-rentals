import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import type { AccidentRecord, Car } from '@core/types/domain';
import { formatCurrency } from '@core/utils/currency';
import { ImageSlider } from '@shared/media';
import { useTranslation } from '@core/i18n';

type AccidentHistoryEmptyScope = 'customer' | 'car';

interface CustomerAccidentHistoryProps {
  accidents: AccidentRecord[];
  carsById: Map<string, Car>;
  onAccidentPress: (accidentId: string) => void;
  /** Car detail vs customer profile empty-state copy. */
  emptyScope?: AccidentHistoryEmptyScope;
}

export const CustomerAccidentHistory = memo<CustomerAccidentHistoryProps>(
  ({ accidents, carsById, onAccidentPress, emptyScope = 'customer' }) => {
    const { t } = useTranslation();
    if (accidents.length === 0) {
      const emptyKey =
        emptyScope === 'car' ? 'cars.noAccidentsForCar' : 'customers.noAccidents';
      return <Text style={typography.bodySmall}>{t(emptyKey)}</Text>;
    }

    return (
      <View style={styles.list}>
        {accidents.map(accident => {
          const car = carsById.get(accident.carId);
          return (
            <Pressable
              key={accident.id}
              style={styles.card}
              onPress={() => onAccidentPress(accident.id)}
              accessibilityRole="button"
            >
              <Text style={styles.description}>{accident.description}</Text>
              <Text style={styles.damage}>
                {t('accidents.damageLabel', { amount: formatCurrency(accident.damageCost) })}
              </Text>
              <Text style={styles.meta}>
                {car?.name ?? t('common.car')} · {formatDate(accident.accidentDate)}
              </Text>
              {accident.notes ? <Text style={styles.notes}>{accident.notes}</Text> : null}
              {accident.proofImages.length > 0 ? (
                <ImageSlider images={accident.proofImages} imageHeight={100} />
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
  description: {
    ...typography.body,
    fontWeight: '600',
  },
  damage: {
    ...typography.h4,
    color: colors.error,
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
