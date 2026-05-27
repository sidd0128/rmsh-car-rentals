import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import type { CarsStackParamList } from '@app/navigation/types';
import { colors, spacing, typography } from '@app/theme';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { SHOW_PAYMENTS_UI } from '@core/constants/features';
import { computeCarTotalPaid, getNextRentDueForCar } from '@core/helpers/rentalPayments';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { FilterBottomSheet, FilterBottomSheetRef } from '@shared/bottomSheets/FilterBottomSheet';
import { screenStyles } from '@shared/layouts/screenStyles';
import { EmptyState } from '@shared/ui';
import { SearchHeader } from '@reusable';
import { returnsSoonFilterDescription } from '@core/services/availabilityService';
import { useCarFilterStore, type CarFilter } from '../store/useCarFilterStore';
import { CarCard } from '../components/CarCard';
import { useFilteredCars } from '../hooks/useFilteredCars';
import { useTranslation } from '@core/i18n';

export const CarsListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<CarsStackParamList>>();
  const route = useRoute<RouteProp<CarsStackParamList, 'CarsList'>>();
  const filteredCars = useFilteredCars();
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const filter = useCarFilterStore(s => s.filter);
  const setFilter = useCarFilterStore(s => s.setFilter);
  const searchQuery = useCarFilterStore(s => s.searchQuery);
  const setSearchQuery = useCarFilterStore(s => s.setSearchQuery);
  const filterRef = useRef<FilterBottomSheetRef>(null);
  const { hydrateAll } = useHydrateStores();
  const { listNumColumns, horizontalPadding } = useDeviceLayout();

  const filterOptions = useMemo(
    (): { label: string; value: CarFilter }[] => [
      { label: t('cars.filters.all'), value: 'ALL' },
      { label: t('cars.filters.available'), value: 'AVAILABLE' },
      { label: t('cars.filters.onRent'), value: 'ON_RENT' },
      { label: t('cars.filters.upcomingBookings'), value: 'UPCOMING_BOOKING' },
      { label: t('cars.filters.returningSoon'), value: 'RETURNING_SOON' },
    ],
    [t],
  );

  const activeFilterLabel = filterOptions.find(option => option.value === filter)?.label;

  useFocusEffect(
    useCallback(() => {
      const paramFilter = route.params?.filter;
      if (!paramFilter) {
        return;
      }
      setFilter(paramFilter);
      setSearchQuery('');
      navigation.setParams({ filter: undefined });
    }, [navigation, route.params?.filter, setFilter, setSearchQuery]),
  );

  const paidByCarId = useMemo(() => {
    const map = new Map<string, number>();
    if (!SHOW_PAYMENTS_UI) {
      return map;
    }
    for (const car of filteredCars) {
      map.set(car.id, computeCarTotalPaid(car.id, rentals, payments));
    }
    return map;
  }, [filteredCars, rentals, payments]);

  const nextRentByCarId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getNextRentDueForCar>>();
    if (!SHOW_PAYMENTS_UI) {
      return map;
    }
    for (const car of filteredCars) {
      const next = getNextRentDueForCar(car, payments);
      if (next) {
        map.set(car.id, next);
      }
    }
    return map;
  }, [filteredCars, payments]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredCars)[0] }) => {
      const customerId = item.currentBooking?.customerId;
      const customer = customers.find(c => c.id === customerId);
      return (
        <CarCard
          car={item}
          customer={customer}
          totalPaid={paidByCarId.get(item.id) ?? 0}
          nextRentDue={nextRentByCarId.get(item.id)}
          hidePaymentInfo={!SHOW_PAYMENTS_UI}
          onPress={() => navigation.navigate('CarDetails', { carId: item.id })}
        />
      );
    },
    [customers, navigation, nextRentByCarId, paidByCarId],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, { paddingHorizontal: horizontalPadding }]}>
        <SearchHeader
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('cars.searchPlaceholder')}
          onFilterPress={() => filterRef.current?.open()}
        />
        {filter !== 'ALL' && activeFilterLabel ? (
          <Text style={styles.activeFilter}>
            {t('common.showingFilter', { label: activeFilterLabel })}
          </Text>
        ) : null}
        {filter === 'RETURNING_SOON' ? (
          <Text style={styles.filterHint}>{returnsSoonFilterDescription()}</Text>
        ) : null}
      </View>
      <View style={styles.list}>
        <FlashList
          data={filteredCars}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={listNumColumns}
          key={`cars-${listNumColumns}`}
          contentContainerStyle={[
            screenStyles.listContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          onRefresh={hydrateAll}
          refreshing={false}
          ListEmptyComponent={
            <EmptyState
              title={t('cars.noCarsFound')}
              description={
                filter === 'RETURNING_SOON'
                  ? returnsSoonFilterDescription()
                  : t('common.tryChangeFilters')
              }
              actionLabel={t('common.addCar')}
              onAction={() => navigation.navigate('CarForm', {})}
            />
          }
        />
      </View>
      <FAB
        icon="plus"
        style={[styles.fab, { right: horizontalPadding }]}
        onPress={() => navigation.navigate('CarForm', {})}
        color={colors.textInverse}
      />
      <FilterBottomSheet
        ref={filterRef}
        title={t('cars.filterTitle')}
        options={filterOptions}
        selected={filter}
        onSelect={setFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  activeFilter: {
    ...typography.label,
    color: colors.primary,
  },
  filterHint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  list: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});
