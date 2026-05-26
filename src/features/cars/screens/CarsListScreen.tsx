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
import { computeCarTotalPaid, getNextRentDueForCar } from '@core/helpers/rentalPayments';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { FilterBottomSheet, FilterBottomSheetRef } from '@shared/bottomSheets/FilterBottomSheet';
import { screenStyles } from '@shared/layouts/screenStyles';
import { EmptyState } from '@shared/ui';
import { SearchHeader } from '@reusable';
import { useCarFilterStore, type CarFilter } from '../store/useCarFilterStore';
import { CarCard } from '../components/CarCard';
import { useFilteredCars } from '../hooks/useFilteredCars';

const FILTER_OPTIONS: { label: string; value: CarFilter }[] = [
  { label: 'All Cars', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'On Rent', value: 'ON_RENT' },
  { label: 'Upcoming Bookings', value: 'UPCOMING_BOOKING' },
];

export const CarsListScreen = () => {
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

  const activeFilterLabel = FILTER_OPTIONS.find(option => option.value === filter)?.label;

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
    for (const car of filteredCars) {
      map.set(car.id, computeCarTotalPaid(car.id, rentals, payments));
    }
    return map;
  }, [filteredCars, rentals, payments]);

  const nextRentByCarId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getNextRentDueForCar>>();
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
          placeholder="Search name, model, plate..."
          onFilterPress={() => filterRef.current?.open()}
        />
        {filter !== 'ALL' && activeFilterLabel ? (
          <Text style={styles.activeFilter}>Showing: {activeFilterLabel}</Text>
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
              title="No cars found"
              description="Try changing filters or add a new car"
              actionLabel="Add Car"
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
        title="Filter Cars"
        options={FILTER_OPTIONS}
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
  list: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});
