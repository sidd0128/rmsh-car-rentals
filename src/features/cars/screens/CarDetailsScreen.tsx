import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { CarsStackParamList } from '@app/navigation/types';
import { spacing, typography } from '@app/theme';
import { SHOW_PAYMENTS_UI } from '@core/constants/features';
import { formatDate, formatDateTimeAmPm } from '@core/helpers/date';
import { formatRentalEndDisplay } from '@core/helpers/rentalDisplay';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
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
import {
  CarDetailsAssignmentPaymentLines,
  CarDetailsTotalReceived,
} from '../components/CarDetailsPaymentInfo';
import { useCarStore } from '../store/useCarStore';
import { useTranslation } from '@core/i18n';

export const CarDetailsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<CarsStackParamList, 'CarDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CarsStackParamList>>();
  const car = useCarStore(s => s.getCarById(route.params.carId));
  const customers = useCustomerStore(s => s.customers);
  const fines = useFineStore(s => s.fines);
  const accidents = useAccidentStore(s => s.accidents);
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const cars = useCarStore(s => s.cars);
  const deleteCar = useCarStore(s => s.deleteCar);
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
  const nextFutureBooking = car?.futureBookings[0];

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

  const handleDeleteCar = useCallback(() => {
    if (!car) {
      return;
    }

    const linkedRentalCount = rentals.filter(rental => rental.carId === car.id).length;
    const linkedPaymentCount = payments.filter(payment => payment.carId === car.id).length;
    const linkedFineCount = fines.filter(fine => fine.carId === car.id).length;
    const linkedAccidentCount = accidents.filter(accident => accident.carId === car.id).length;
    const linkedRecordCount =
      linkedRentalCount + linkedPaymentCount + linkedFineCount + linkedAccidentCount;

    if (linkedRecordCount > 0) {
      Alert.alert(
        t('cars.deleteBlockedTitle'),
        t('cars.deleteBlockedMessage', {
          rentals: linkedRentalCount,
          payments: linkedPaymentCount,
          fines: linkedFineCount,
          accidents: linkedAccidentCount,
        }),
      );
      return;
    }

    Alert.alert(t('cars.deleteTitle'), t('cars.deleteMessage', { car: car.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('cars.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCar(car.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert(
              t('cars.deleteFailedTitle'),
              error instanceof Error ? error.message : t('common.notAvailable'),
            );
          }
        },
      },
    ]);
  }, [accidents, car, deleteCar, fines, navigation, payments, rentals, t]);

  if (!car) {
    return (
      <ScreenLayout>
        <Text>{t('cars.notFound')}</Text>
      </ScreenLayout>
    );
  }

  const badge = carStatusToBadge(car.status);
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
            {SHOW_PAYMENTS_UI ? <CarDetailsAssignmentPaymentLines car={car} /> : null}
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
        {SHOW_PAYMENTS_UI ? <CarDetailsTotalReceived car={car} /> : null}
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
        {!activeRental && nextFutureBooking ? (
          <AppButton
            label={t('cars.endUpcomingBooking')}
            variant="outline"
            onPress={() => setEndRef.current?.open(nextFutureBooking)}
            fullWidth
          />
        ) : null}
        <AppButton
          label={t('cars.editCar')}
          variant="outline"
          onPress={() => navigation.navigate('CarForm', { carId: car.id })}
          fullWidth
        />
        <AppButton
          label={t('cars.deleteCar')}
          variant="danger"
          onPress={handleDeleteCar}
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
});
