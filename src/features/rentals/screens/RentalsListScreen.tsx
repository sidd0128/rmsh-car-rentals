import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { RentalsStackParamList } from '@app/navigation/types';
import { colors, spacing, typography, shadows, radius } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '../store/useRentalStore';
import { StatusBadge } from '@shared/ui';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';

export const RentalsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RentalsStackParamList>>();
  const rentals = useRentalStore(s => s.rentals);
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);

  const renderItem = useCallback(
    ({ item }: { item: (typeof rentals)[0] }) => {
      const car = cars.find(c => c.id === item.carId);
      const customer = customers.find(c => c.id === item.customerId);
      return (
        <Pressable
          onPress={() => navigation.navigate('RentalDetails', { rentalId: item.id })}
          style={[styles.card, shadows.sm]}
        >
          <Text style={typography.h4}>{car?.name ?? 'Car'}</Text>
          <Text style={typography.bodySmall}>{customer?.name}</Text>
          <Text style={typography.bodySmall}>
            {formatDate(item.startDate)} – {formatDate(item.endDate)}
          </Text>
          <View style={styles.row}>
            <Text style={typography.body}>{formatCurrency(item.agreedPrice)}</Text>
            <StatusBadge
              label={item.status}
              variant={item.status === 'ACTIVE' ? 'on_rent' : 'default'}
            />
          </View>
        </Pressable>
      );
    },
    [cars, customers, navigation],
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={rentals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
});
