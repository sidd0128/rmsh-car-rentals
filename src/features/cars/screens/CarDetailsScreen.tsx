import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { CarsStackParamList } from '@app/navigation/types';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { SHOW_PAYMENTS_UI } from '@core/constants/features';
import { formatDate, formatDateTimeAmPm } from '@core/helpers/date';
import { formatRentalEndDisplay } from '@core/helpers/rentalDisplay';
import { computeCarTotalPaid, getNextRentDueForCar } from '@core/helpers/rentalPayments';
import { formatCurrency } from '@core/utils/currency';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { ScreenSection } from '@shared/layouts/ScreenSection';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AssignmentModal, AssignmentModalRef } from '@shared/modals/AssignmentModal';
import { SetRentalEndModal, SetRentalEndModalRef } from '@shared/modals/SetRentalEndModal';
import { AppButton, StatusBadge, carStatusToBadge } from '@shared/ui';
import { ImageSlider } from '@shared/media';
import { CustomerAccidentHistory } from '@features/customers/components/CustomerAccidentHistory';
import { CustomerFineHistory } from '@features/customers/components/CustomerFineHistory';
import { useCarStore } from '../store/useCarStore';
import { useTranslation } from '@core/i18n';

export const CarDetailsScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
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
  const setEndRef = useRef<SetRentalEndModalRef>(null);
  const { hydrateAll } = useHydrateStores();

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

  const activeRental = car?.currentBooking;

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

  const nextRentDue = useMemo(
    () =>
      SHOW_PAYMENTS_UI && car ? getNextRentDueForCar(car, payments) : null,
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
  const totalPaid = SHOW_PAYMENTS_UI ? computeCarTotalPaid(car.id, rentals, payments) : 0;
  const isCarAvailable = car.status === 'AVAILABLE';

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
              {t('cars.sinceUntilDateTime', {
                start: formatDateTimeAmPm(car.currentBooking.startDate),
                end: formatRentalEndDisplay(car.currentBooking.endDate),
              })}
            </Text>
            {SHOW_PAYMENTS_UI && nextRentDue ? (
              <Text style={[styles.nextRent, { color: colors.warning }]}>
                {t('cars.nextRentPaymentDue', {
                  amount: formatCurrency(nextRentDue.amount),
                  date: formatDateTimeAmPm(nextRentDue.dueDate),
                })}
              </Text>
            ) : null}
            {SHOW_PAYMENTS_UI && !nextRentDue ? (
              <Text style={typography.bodySmall}>{t('cars.allInstallmentsReceived')}</Text>
            ) : null}
          </>
        ) : (
          <Text style={typography.bodySmall}>
            {t('cars.availableNextBooking', {
              date: car.futureBookings[0]
                ? formatDateTimeAmPm(car.futureBookings[0].startDate)
                : t('cars.noneScheduled'),
            })}
          </Text>
        )}
        {SHOW_PAYMENTS_UI ? (
          <Text style={[styles.earnings, { color: colors.primary }]}>
            {t('cars.totalReceived', { amount: formatCurrency(totalPaid) })}
          </Text>
        ) : null}
      </ScreenSection>

      <ScreenSection title={t('common.details')} showDivider>
        <Text style={typography.bodySmall}>
          {t('cars.regoExpiryDate')}: {car.regoExpiryDate ? formatDate(car.regoExpiryDate) : t('common.notAvailable')}
        </Text>
        <Text style={typography.bodySmall}>
          {t('cars.purchaseDate')}: {car.purchaseDate ? formatDate(car.purchaseDate) : t('common.notAvailable')}
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
        {activeRental ? (
          <AppButton
            label={t('cars.setEndDateTime')}
            variant="outline"
            onPress={() => setEndRef.current?.open(activeRental)}
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
          hydrateAll().catch(() => undefined);
        }}
        onAddCustomer={() => navigation.getParent()?.navigate('CustomersTab')}
      />
      <SetRentalEndModal ref={setEndRef} onSuccess={hydrateAll} />
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
    marginTop: spacing.sm,
  },
  nextRent: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});
