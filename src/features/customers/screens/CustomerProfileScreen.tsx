import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import type { CustomersStackParamList } from '@app/navigation/types';
import { colors, spacing, typography } from '@app/theme';
import { formatCurrency } from '@core/utils/currency';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { AppButton, TimelineView } from '@shared/ui';
import { ImageSlider } from '@shared/media';
import { useCustomerStore } from '../store/useCustomerStore';
import { useCustomerRentalInfo } from '../hooks/useFilteredCustomers';
import { formatDate } from '@core/helpers/date';

export const CustomerProfileScreen = () => {
  const route = useRoute<RouteProp<CustomersStackParamList, 'CustomerProfile'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const customer = useCustomerStore(s => s.getCustomerById(route.params.customerId));
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const fines = useFineStore(s => s.fines);
  const accidents = useAccidentStore(s => s.accidents);
  const cars = useCarStore(s => s.cars);
  const { activeRental, car } = useCustomerRentalInfo(route.params.customerId);

  const customerRentals = useMemo(
    () => rentals.filter(r => r.customerId === route.params.customerId),
    [rentals, route.params.customerId],
  );

  const customerPayments = payments.filter(p => p.customerId === route.params.customerId);
  const customerFines = fines.filter(f => f.customerId === route.params.customerId);
  const customerAccidents = accidents.filter(a => a.customerId === route.params.customerId);

  if (!customer) {
    return (
      <ScreenLayout>
        <Text>Customer not found</Text>
      </ScreenLayout>
    );
  }

  const timeline = customerRentals.map(r => {
    const rentalCar = cars.find(c => c.id === r.carId);
    return {
      id: r.id,
      title: rentalCar?.name ?? 'Car',
      subtitle: formatCurrency(r.agreedPrice),
      date: `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
      meta: r.status,
    };
  });

  return (
    <ScreenLayout>
      {customer.photo ? (
        <Image source={{ uri: customer.photo }} style={styles.avatar} />
      ) : null}
      <Text style={typography.h2}>{customer.name}</Text>
      <Text style={typography.bodySmall}>
        {customer.age} yrs · {customer.phone}
      </Text>
      <Text style={typography.bodySmall}>{customer.address}</Text>
      {customer.isBlacklisted ? (
        <Text style={styles.blacklist}>⚠ Blacklisted customer</Text>
      ) : null}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={typography.h3}>{customer.totalRentals}</Text>
          <Text style={typography.caption}>Rentals</Text>
        </View>
        <View style={styles.stat}>
          <Text style={typography.h3}>{formatCurrency(customer.totalSpent)}</Text>
          <Text style={typography.caption}>Total spent</Text>
        </View>
      </View>

      <Divider style={styles.divider} />
      <Text style={typography.h3}>Current Rental</Text>
      {car && activeRental ? (
        <Text style={typography.body}>
          {car.name} until {formatDate(activeRental.endDate)}
        </Text>
      ) : (
        <Text style={typography.bodySmall}>No active rental</Text>
      )}

      <Text style={typography.h3}>Driving License</Text>
      <ImageSlider images={customer.drivingLicenseImages} imageHeight={120} />

      <Text style={typography.h3}>Documents</Text>
      <ImageSlider images={customer.documents} imageHeight={120} />

      <Text style={typography.h3}>Rental History</Text>
      <TimelineView items={timeline} />

      <Text style={typography.h3}>Payment History</Text>
      {customerPayments.map(p => (
        <Text key={p.id} style={typography.bodySmall}>
          {formatCurrency(p.amount)} — {p.status}
        </Text>
      ))}

      {customerFines.length > 0 ? (
        <>
          <Text style={typography.h3}>Fines</Text>
          {customerFines.map(f => (
            <Text key={f.id} style={typography.bodySmall}>
              {formatCurrency(f.amount)} — {f.reason} ({f.paidStatus ? 'Paid' : 'Unpaid'})
            </Text>
          ))}
        </>
      ) : null}

      {customerAccidents.length > 0 ? (
        <>
          <Text style={typography.h3}>Accidents</Text>
          {customerAccidents.map(a => (
            <Text key={a.id} style={typography.bodySmall}>
              {a.description} — {formatCurrency(a.damageCost)}
            </Text>
          ))}
        </>
      ) : null}

      <AppButton
        label="Edit Profile"
        variant="outline"
        onPress={() => navigation.navigate('CustomerForm', { customerId: customer.id })}
        fullWidth
        style={styles.btn}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.md },
  blacklist: { color: colors.error, marginTop: spacing.sm, fontWeight: '600' },
  stats: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xl },
  stat: { alignItems: 'center' },
  divider: { marginVertical: spacing.lg },
  btn: { marginTop: spacing.xl },
});
