import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import type { CarsStackParamList } from '@app/navigation/types';
import { colors, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { AssignmentModal, AssignmentModalRef } from '@shared/modals/AssignmentModal';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { AppButton, StatusBadge, carStatusToBadge, TimelineView } from '@shared/ui';
import { ImageSlider } from '@shared/media';
import { useCarStore } from '../store/useCarStore';
import { useHydrateStores } from '@core/hooks/useHydrateStores';

export const CarDetailsScreen = () => {
  const route = useRoute<RouteProp<CarsStackParamList, 'CarDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CarsStackParamList>>();
  const car = useCarStore(s => s.getCarById(route.params.carId));
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const fines = useFineStore(s => s.fines);
  const accidents = useAccidentStore(s => s.accidents);
  const assignmentRef = useRef<AssignmentModalRef>(null);
  const { hydrateAll } = useHydrateStores();

  const carRentals = useMemo(
    () =>
      rentals
        .filter(r => r.carId === route.params.carId)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [rentals, route.params.carId],
  );

  const carFines = fines.filter(f => f.carId === route.params.carId);
  const carAccidents = accidents.filter(a => a.carId === route.params.carId);

  const currentCustomer = useMemo(() => {
    const cid = car?.currentBooking?.customerId;
    return cid ? customers.find(c => c.id === cid) : undefined;
  }, [car, customers]);

  if (!car) {
    return (
      <ScreenLayout>
        <Text>Car not found</Text>
      </ScreenLayout>
    );
  }

  const badge = carStatusToBadge(car.status);

  const timeline = carRentals.map(r => {
    const customer = customers.find(c => c.id === r.customerId);
    return {
      id: r.id,
      title: customer?.name ?? 'Customer',
      subtitle: `${formatCurrency(r.agreedPrice)} · ${r.paymentStatus}`,
      date: `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
      meta: r.status,
    };
  });

  return (
    <ScreenLayout onRefresh={hydrateAll}>
      <ImageSlider images={car.images} imageHeight={220} />
      <View style={styles.header}>
        <Text style={typography.h2}>{car.name}</Text>
        <StatusBadge label={badge.label} variant={badge.variant} />
      </View>
      <Text style={typography.bodySmall}>
        {car.brand} {car.model} · {car.year} · {car.color} · {car.numberPlate}
      </Text>

      <Divider style={styles.divider} />
      <Text style={typography.h3}>Current Assignment</Text>
      {currentCustomer && car.currentBooking ? (
        <>
          <Text style={typography.body}>{currentCustomer.name}</Text>
          <Text style={typography.bodySmall}>
            Since {formatDate(car.currentBooking.startDate)} until{' '}
            {formatDate(car.currentBooking.endDate)}
          </Text>
        </>
      ) : (
        <Text style={typography.bodySmall}>
          Available · Next booking:{' '}
          {car.futureBookings[0]
            ? formatDate(car.futureBookings[0].startDate)
            : 'None scheduled'}
        </Text>
      )}

      <Text style={styles.earnings}>Total earnings: {formatCurrency(car.totalEarnings)}</Text>

      <AppButton
        label="Assign Customer"
        onPress={() => assignmentRef.current?.open(car.id)}
        fullWidth
        style={styles.btn}
      />
      <AppButton
        label="Edit Car"
        variant="outline"
        onPress={() => navigation.navigate('CarForm', { carId: car.id })}
        fullWidth
      />

      <Divider style={styles.divider} />
      <Text style={typography.h3}>Rental History</Text>
      <TimelineView items={timeline} />

      {carFines.length > 0 ? (
        <>
          <Text style={typography.h3}>Fine History</Text>
          {carFines.map(f => (
            <Text key={f.id} style={typography.bodySmall}>
              {formatCurrency(f.amount)} — {f.reason}
            </Text>
          ))}
        </>
      ) : null}

      {carAccidents.length > 0 ? (
        <>
          <Text style={typography.h3}>Accident History</Text>
          {carAccidents.map(a => (
            <Text key={a.id} style={typography.bodySmall}>
              {formatCurrency(a.damageCost)} — {a.description}
            </Text>
          ))}
        </>
      ) : null}

      <AssignmentModal
        ref={assignmentRef}
        onSuccess={hydrateAll}
        onAddCustomer={() => navigation.getParent()?.navigate('CustomersTab')}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  divider: { marginVertical: spacing.lg },
  earnings: { ...typography.h4, color: colors.primary, marginVertical: spacing.md },
  btn: { marginBottom: spacing.sm },
});
