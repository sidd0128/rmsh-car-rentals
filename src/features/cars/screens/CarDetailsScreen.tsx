import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
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
import { CustomerAccidentHistory } from '@features/customers/components/CustomerAccidentHistory';
import { CustomerFineHistory } from '@features/customers/components/CustomerFineHistory';
import { useCarStore } from '../store/useCarStore';
import { useTranslation } from '@core/i18n';

export const CarDetailsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<CarsStackParamList, 'CarDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CarsStackParamList>>();
  const car = useCarStore(s => s.getCarById(route.params.carId));
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const fines = useFineStore(s => s.fines);
  const accidents = useAccidentStore(s => s.accidents);
  const cars = useCarStore(s => s.cars);
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

  const carsById = useMemo(() => new Map(cars.map(c => [c.id, c])), [cars]);

  const carFines = useMemo(
    () =>
      fines
        .filter(f => f.carId === route.params.carId)
        .sort((a, b) => dayjs(b.fineDate).valueOf() - dayjs(a.fineDate).valueOf()),
    [fines, route.params.carId],
  );

  const carAccidents = useMemo(
    () =>
      accidents
        .filter(a => a.carId === route.params.carId)
        .sort((a, b) => dayjs(b.accidentDate).valueOf() - dayjs(a.accidentDate).valueOf()),
    [accidents, route.params.carId],
  );

  const onFinePress = useCallback(
    (fineId: string) => navigation.navigate('FineDetails', { fineId }),
    [navigation],
  );

  const onAccidentPress = useCallback(
    (accidentId: string) => navigation.navigate('AccidentDetails', { accidentId }),
    [navigation],
  );

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
        <Text>{t('cars.notFound')}</Text>
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
      title: customer?.name ?? t('common.customer'),
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

      <ScreenSection title={t('cars.currentAssignment')} first>
        {currentCustomer && car.currentBooking ? (
          <>
            <Text style={typography.body}>{currentCustomer.name}</Text>
            <Text style={typography.bodySmall}>
              {t('cars.sinceUntil', {
                start: formatDate(car.currentBooking.startDate),
                end: formatDate(car.currentBooking.endDate),
              })}
            </Text>
            {nextRentDue ? (
              <Text style={styles.nextRent}>
                {t('cars.nextRentPaymentDue', {
                  amount: formatCurrency(nextRentDue.amount),
                  date: formatDate(nextRentDue.dueDate),
                })}
              </Text>
            ) : (
              <Text style={typography.bodySmall}>{t('cars.allInstallmentsReceived')}</Text>
            )}
          </>
        ) : (
          <Text style={typography.bodySmall}>
            {t('cars.availableNextBooking', {
              date: car.futureBookings[0]
                ? formatDate(car.futureBookings[0].startDate)
                : t('cars.noneScheduled'),
            })}
          </Text>
        )}
        <Text style={styles.earnings}>
          {t('cars.totalReceived', { amount: formatCurrency(totalPaid) })}
        </Text>
      </ScreenSection>

      <View style={screenStyles.actions}>
        {isCarAvailable ? (
          <AppButton
            label={t('cars.assignCustomer')}
            onPress={() => assignmentRef.current?.open(car.id)}
            fullWidth
          />
        ) : null}
        {canExtendBooking && activeBooking ? (
          <AppButton
            label={t('cars.extendBooking')}
            variant="outline"
            onPress={() => extendRef.current?.open(activeBooking)}
            fullWidth
          />
        ) : null}
        <AppButton
          label={t('cars.editCar')}
          variant="outline"
          onPress={() => navigation.navigate('CarForm', { carId: car.id })}
          fullWidth
        />
      </View>

      <ScreenSection title={t('cars.rentalHistory')} showDivider>
        <TimelineView items={timeline} />
      </ScreenSection>

      <ScreenSection
        title={t('common.sectionCount', { title: t('cars.fines'), count: carFines.length })}
        showDivider
      >
        <CustomerFineHistory
          fines={carFines}
          carsById={carsById}
          onFinePress={onFinePress}
          emptyScope="car"
        />
      </ScreenSection>

      <ScreenSection
        title={t('common.sectionCount', {
          title: t('cars.accidents'),
          count: carAccidents.length,
        })}
      >
        <CustomerAccidentHistory
          accidents={carAccidents}
          carsById={carsById}
          onAccidentPress={onAccidentPress}
          emptyScope="car"
        />
      </ScreenSection>
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
