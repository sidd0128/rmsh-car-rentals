import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, shadows, radius, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import type { Car } from '@core/types/domain';
import type { Customer } from '@core/types/domain';
import { StatusBadge, carStatusToBadge } from '@shared/ui/StatusBadge';

interface CarCardProps {
  car: Car;
  customer?: Customer;
  onPress: () => void;
}

export const CarCard = memo<CarCardProps>(({ car, customer, onPress }) => {
  const badge = carStatusToBadge(car.status);
  const imageUri = car.images[0];

  return (
    <Pressable onPress={onPress} style={[styles.card, shadows.md]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={typography.h4}>{car.name}</Text>
          <StatusBadge label={badge.label} variant={badge.variant} />
        </View>
        <Text style={typography.bodySmall}>
          {car.brand} {car.model} · {car.numberPlate}
        </Text>
        {customer ? (
          <Text style={styles.customer}>Rented by {customer.name}</Text>
        ) : car.futureBookings[0] ? (
          <Text style={styles.customer}>
            Next booking: {formatDate(car.futureBookings[0].startDate)}
          </Text>
        ) : (
          <Text style={styles.customer}>Available now</Text>
        )}
        <Text style={styles.earnings}>{formatCurrency(car.totalEarnings)} earned</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 140 },
  placeholder: { backgroundColor: colors.borderLight },
  body: { padding: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  customer: { ...typography.bodySmall, marginTop: spacing.xs },
  earnings: { ...typography.caption, color: colors.primary, marginTop: spacing.sm },
});
