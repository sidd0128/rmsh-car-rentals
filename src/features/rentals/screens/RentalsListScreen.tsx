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
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { rentalPaymentProgressLabel } from '@core/helpers/rentalPayments';
import { billingFrequencyLabel } from '@core/services/rentalBillingService';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { screenStyles } from '@shared/layouts/screenStyles';
import { StatusBadge } from '@shared/ui';
import { useRentalStore } from '../store/useRentalStore';

export const RentalsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RentalsStackParamList>>();
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);
  const { listNumColumns, horizontalPadding } = useDeviceLayout();

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
          <Text style={[typography.bodySmall, styles.cardLine]}>{customer?.name}</Text>
          <Text style={typography.bodySmall}>
            {formatDate(item.startDate)} – {formatDate(item.endDate)}
          </Text>
          <Text style={typography.body}>{formatCurrency(item.agreedPrice)} total</Text>
          {item.billingFrequency ? (
            <Text style={typography.caption}>
              {billingFrequencyLabel(item.billingFrequency)}
              {item.rateAmount != null ? ` · ${formatCurrency(item.rateAmount)}` : ''}
            </Text>
          ) : null}
          <Text style={typography.caption}>
            {rentalPaymentProgressLabel(item.id, payments)}
          </Text>
          <View style={styles.row}>
            <StatusBadge
              label={item.paymentStatus}
              variant={item.paymentStatus === 'DONE' ? 'done' : 'pending'}
            />
            <StatusBadge
              label={item.status}
              variant={item.status === 'ACTIVE' ? 'on_rent' : 'default'}
            />
          </View>
        </Pressable>
      );
    },
    [cars, customers, navigation, payments],
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={rentals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={listNumColumns}
        key={`rentals-${listNumColumns}`}
        contentContainerStyle={[
          screenStyles.listContent,
          { paddingHorizontal: horizontalPadding, paddingTop: spacing.lg },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  cardLine: {
    marginTop: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
