import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { CustomersStackParamList } from '@app/navigation/types';
import { colors, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { sortPaymentsByDueDate } from '@core/helpers/paymentInstallment';
import { computeCustomerTotalPaid } from '@core/helpers/rentalPayments';
import { formatCurrency } from '@core/utils/currency';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { ScreenSection } from '@shared/layouts/ScreenSection';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, TimelineView } from '@shared/ui';
import { ImageSlider } from '@shared/media';
import { CustomerPaymentHistory } from '../components/CustomerPaymentHistory';
import { useCustomerStore } from '../store/useCustomerStore';
import { useCustomerRentalInfo } from '../hooks/useCustomerRentalInfo';

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

  const customerPayments = useMemo(
    () =>
      sortPaymentsByDueDate(
        payments.filter(p => p.customerId === route.params.customerId),
      ).reverse(),
    [payments, route.params.customerId],
  );
  const totalRentals = customerRentals.length;
  const totalSpent = computeCustomerTotalPaid(route.params.customerId, rentals, payments);
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
      <View style={styles.profileHeader}>
        {customer.photo ? (
          <Image source={{ uri: customer.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>
              {customer.name
                .split(' ')
                .map(p => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.profileText}>
          <Text style={typography.h2}>{customer.name}</Text>
          <Text style={typography.bodySmall}>
            {customer.age} yrs · {customer.phone}
          </Text>
          <Text style={typography.bodySmall}>{customer.address}</Text>
          {customer.isBlacklisted ? (
            <Text style={styles.blacklist}>Blacklisted customer</Text>
          ) : null}
        </View>
      </View>

      <View style={screenStyles.statsRow}>
        <View style={screenStyles.statCard}>
          <Text style={screenStyles.statValue}>{totalRentals}</Text>
          <Text style={screenStyles.statLabel}>Rentals</Text>
        </View>
        <View style={screenStyles.statCard}>
          <Text style={screenStyles.statValue}>{formatCurrency(totalSpent)}</Text>
          <Text style={screenStyles.statLabel}>Total spent</Text>
        </View>
      </View>

      <ScreenSection title="Current rental" showDivider>
        {car && activeRental ? (
          <Text style={typography.body}>
            {car.name} until {formatDate(activeRental.endDate)}
          </Text>
        ) : (
          <Text style={typography.bodySmall}>No active rental</Text>
        )}
      </ScreenSection>

      <ScreenSection title="Driving license">
        <ImageSlider images={customer.drivingLicenseImages} imageHeight={140} />
      </ScreenSection>

      <ScreenSection title="Documents">
        <ImageSlider images={customer.documents} imageHeight={140} />
      </ScreenSection>

      <ScreenSection title="Rental history">
        <TimelineView items={timeline} />
      </ScreenSection>

      <ScreenSection title="Payment history">
        <CustomerPaymentHistory payments={customerPayments} />
      </ScreenSection>

      {customerFines.length > 0 ? (
        <ScreenSection title="Fines">
          {customerFines.map(f => (
            <Text key={f.id} style={typography.bodySmall}>
              {formatCurrency(f.amount)} — {f.reason} ({f.paidStatus ? 'Paid' : 'Unpaid'})
            </Text>
          ))}
        </ScreenSection>
      ) : null}

      {customerAccidents.length > 0 ? (
        <ScreenSection title="Accidents">
          {customerAccidents.map(a => (
            <Text key={a.id} style={typography.bodySmall}>
              {a.description} — {formatCurrency(a.damageCost)}
            </Text>
          ))}
        </ScreenSection>
      ) : null}

      <AppButton
        label="Edit Profile"
        variant="outline"
        onPress={() => navigation.navigate('CustomerForm', { customerId: customer.id })}
        fullWidth
        style={styles.editBtn}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    backgroundColor: colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.h3,
    color: colors.primary,
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  blacklist: {
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '600',
    fontSize: 13,
  },
  editBtn: {
    marginTop: spacing.xl,
  },
});
