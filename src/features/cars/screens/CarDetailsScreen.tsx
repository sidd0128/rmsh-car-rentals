import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { CarsStackParamList } from '@app/navigation/types';
import { colors, spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { computeCarTotalPaid, getNextRentDueForCar } from '@core/helpers/rentalPayments';
import { formatCurrency } from '@core/utils/currency';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { useCanExtendRental } from '@features/rentals/hooks/useCanExtendRental';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { ScreenSection } from '@shared/layouts/ScreenSection';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AssignmentModal, AssignmentModalRef } from '@shared/modals/AssignmentModal';
import { ExtendBookingModal, ExtendBookingModalRef } from '@shared/modals/ExtendBookingModal';
import { AppButton, StatusBadge, carStatusToBadge, TimelineView } from '@shared/ui';
import { ImageSlider } from '@shared/media';
import { useCarStore } from '../store/useCarStore';

export const CarDetailsScreen = () => {
  const route = useRoute<RouteProp<CarsStackParamList, 'CarDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CarsStackParamList>>();
  const car = useCarStore(s => s.getCarById(route.params.carId));
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const fines = useFineStore(s => s.fines);
  const accidents = useAccidentStore(s => s.accidents);
  const assignmentRef = useRef<AssignmentModalRef>(null);
  const extendRef = useRef<ExtendBookingModalRef>(null);
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

  const activeBooking = car?.currentBooking;
  const canExtendBooking = useCanExtendRental(activeBooking);
  const nextRentDue = useMemo(
    () => (car ? getNextRentDueForCar(car, payments) : null),
    [car, payments],
  );

  if (!car) {
    return (
      <ScreenLayout>
        <Text>Car not found</Text>
      </ScreenLayout>
    );
  }

  const badge = carStatusToBadge(car.status);
  const totalPaid = computeCarTotalPaid(car.id, rentals, payments);
  const isCarAvailable = car.status === 'AVAILABLE';

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
    <View style={styles.screen}>
    <ScreenLayout onRefresh={hydrateAll} bleedTop={<ImageSlider images={car.images} imageHeight={240} />}>
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <Text style={typography.h2}>{car.name}</Text>
          <Text style={typography.bodySmall}>
            {car.brand} {car.model} · {car.year} · {car.color} · {car.numberPlate}
          </Text>
        </View>
        <StatusBadge label={badge.label} variant={badge.variant} />
      </View>

      <ScreenSection title="Current assignment" first>
        {currentCustomer && car.currentBooking ? (
          <>
            <Text style={typography.body}>{currentCustomer.name}</Text>
            <Text style={typography.bodySmall}>
              Since {formatDate(car.currentBooking.startDate)} until{' '}
              {formatDate(car.currentBooking.endDate)}
            </Text>
            {nextRentDue ? (
              <Text style={styles.nextRent}>
                Next rent {formatCurrency(nextRentDue.amount)} · payment due{' '}
                {formatDate(nextRentDue.dueDate)}
              </Text>
            ) : (
              <Text style={typography.bodySmall}>All installments received for this contract.</Text>
            )}
          </>
        ) : (
          <Text style={typography.bodySmall}>
            Available · Next booking:{' '}
            {car.futureBookings[0]
              ? formatDate(car.futureBookings[0].startDate)
              : 'None scheduled'}
          </Text>
        )}
        <Text style={styles.earnings}>Total received: {formatCurrency(totalPaid)}</Text>
      </ScreenSection>

      <View style={screenStyles.actions}>
        {isCarAvailable ? (
          <AppButton
            label="Assign Customer"
            onPress={() => assignmentRef.current?.open(car.id)}
            fullWidth
          />
        ) : null}
        {canExtendBooking && activeBooking ? (
          <AppButton
            label="Extend booking"
            variant="outline"
            onPress={() => extendRef.current?.open(activeBooking)}
            fullWidth
          />
        ) : null}
        <AppButton
          label="Edit Car"
          variant="outline"
          onPress={() => navigation.navigate('CarForm', { carId: car.id })}
          fullWidth
        />
      </View>

      <ScreenSection title="Rental history" showDivider>
        <TimelineView items={timeline} />
      </ScreenSection>

      {carFines.length > 0 ? (
        <ScreenSection title="Fine history">
          {carFines.map(f => (
            <Text key={f.id} style={typography.bodySmall}>
              {formatCurrency(f.amount)} — {f.reason}
            </Text>
          ))}
        </ScreenSection>
      ) : null}

      {carAccidents.length > 0 ? (
        <ScreenSection title="Accident history">
          {carAccidents.map(a => (
            <Text key={a.id} style={typography.bodySmall}>
              {formatCurrency(a.damageCost)} — {a.description}
            </Text>
          ))}
        </ScreenSection>
      ) : null}
    </ScreenLayout>

      <AssignmentModal
        ref={assignmentRef}
        onSuccess={() => {
          void hydrateAll();
        }}
        onAddCustomer={() => navigation.getParent()?.navigate('CustomersTab')}
      />
      <ExtendBookingModal ref={extendRef} onSuccess={hydrateAll} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleCol: {
    flex: 1,
    gap: spacing.xs,
  },
  earnings: {
    ...typography.h4,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  nextRent: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});
