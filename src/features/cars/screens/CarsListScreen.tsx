import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB } from 'react-native-paper';
import type { CarsStackParamList } from '@app/navigation/types';
import { colors, spacing } from '@app/theme';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { FilterBottomSheet, FilterBottomSheetRef } from '@shared/bottomSheets/FilterBottomSheet';
import { EmptyState, SearchHeader } from '@shared/ui';
import { useCarFilterStore, type CarFilter } from '../store/useCarFilterStore';
import { CarCard } from '../components/CarCard';
import { useFilteredCars } from '../hooks/useFilteredCars';

const FILTER_OPTIONS: { label: string; value: CarFilter }[] = [
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'All Cars', value: 'ALL' },
  { label: 'On Rent', value: 'ON_RENT' },
  { label: 'Upcoming Bookings', value: 'UPCOMING_BOOKING' },
];

export const CarsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<CarsStackParamList>>();
  const filteredCars = useFilteredCars();
  const customers = useCustomerStore(s => s.customers);
  const filter = useCarFilterStore(s => s.filter);
  const setFilter = useCarFilterStore(s => s.setFilter);
  const searchQuery = useCarFilterStore(s => s.searchQuery);
  const setSearchQuery = useCarFilterStore(s => s.setSearchQuery);
  const filterRef = useRef<FilterBottomSheetRef>(null);
  const { hydrateAll } = useHydrateStores();

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredCars)[0] }) => {
      const customerId = item.currentBooking?.customerId;
      const customer = customers.find(c => c.id === customerId);
      return (
        <CarCard
          car={item}
          customer={customer}
          onPress={() => navigation.navigate('CarDetails', { carId: item.id })}
        />
      );
    },
    [customers, navigation],
  );

  return (
    <View style={styles.container}>
      <SearchHeader
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search name, model, plate..."
        onFilterPress={() => filterRef.current?.open()}
      />
      <View style={styles.list}>
        <FlashList
          data={filteredCars}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
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
        style={styles.fab}
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
  list: { flex: 1, paddingHorizontal: spacing.lg },
  listContent: { paddingTop: spacing.md, paddingBottom: 100 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, backgroundColor: colors.primary },
});
