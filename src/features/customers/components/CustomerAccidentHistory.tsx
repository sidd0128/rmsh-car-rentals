import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import type { AccidentRecord, Car } from '@core/types/domain';
import { formatCurrency } from '@core/utils/currency';
import { ImageSlider } from '@shared/media';

interface CustomerAccidentHistoryProps {
  accidents: AccidentRecord[];
  carsById: Map<string, Car>;
  onAccidentPress: (accidentId: string) => void;
}

export const CustomerAccidentHistory = memo<CustomerAccidentHistoryProps>(
  ({ accidents, carsById, onAccidentPress }) => {
    if (accidents.length === 0) {
      return <Text style={typography.bodySmall}>No accident reports for this customer.</Text>;
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
              <Text style={styles.damage}>Damage: {formatCurrency(accident.damageCost)}</Text>
              <Text style={styles.meta}>
                {car?.name ?? 'Car'} · {formatDate(accident.accidentDate)}
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
