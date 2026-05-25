import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { RentalsStackParamList } from '@app/navigation/types';
import { spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { AppButton, StatusBadge } from '@shared/ui';
import { useRentalStore } from '../store/useRentalStore';

export const RentalDetailsScreen = () => {
  const route = useRoute<RouteProp<RentalsStackParamList, 'RentalDetails'>>();
  const rental = useRentalStore(s => s.rentals.find(r => r.id === route.params.rentalId));
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);
  const updatePaymentStatus = usePaymentStore(s => s.updatePaymentStatus);
  const payments = usePaymentStore(s => s.payments);

  if (!rental) {
    return (
      <ScreenLayout>
        <Text>Rental not found</Text>
      </ScreenLayout>
    );
  }

  const car = cars.find(c => c.id === rental.carId);
  const customer = customers.find(c => c.id === rental.customerId);
  const payment = payments.find(p => p.rentalId === rental.id);

  const markPaid = async () => {
    if (payment) {
      await updatePaymentStatus(payment.id, 'DONE');
    }
  };

  return (
    <ScreenLayout>
      <Text style={typography.h2}>{car?.name}</Text>
      <Text style={typography.body}>{customer?.name}</Text>
      <View style={styles.badges}>
        <StatusBadge label={rental.status} variant="on_rent" />
        <StatusBadge
          label={rental.paymentStatus}
          variant={rental.paymentStatus === 'DONE' ? 'done' : 'pending'}
        />
      </View>
      <Text style={typography.body}>
        {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
      </Text>
      <Text style={typography.h3}>{formatCurrency(rental.agreedPrice)}</Text>
      {rental.notes ? <Text style={typography.bodySmall}>{rental.notes}</Text> : null}
      {rental.paymentStatus === 'PENDING' ? (
        <AppButton label="Mark Payment Done" onPress={markPaid} fullWidth style={styles.btn} />
      ) : null}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  btn: { marginTop: spacing.xl },
});
