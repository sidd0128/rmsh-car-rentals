import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FAB, SegmentedButtons, Text } from 'react-native-paper';
import type { CustomersStackParamList } from '@app/navigation/types';
import { colors, spacing, typography, shadows, radius } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { FilterBottomSheet, FilterBottomSheetRef } from '@shared/bottomSheets/FilterBottomSheet';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { EmptyState, SearchHeader, StatusBadge } from '@shared/ui';
import {
  useCustomerStore,
  type CustomerFilter,
} from '../store/useCustomerStore';
import { useFilteredCustomers, useCustomerRentalInfo } from '../hooks/useFilteredCustomers';

const FILTER_OPTIONS: { label: string; value: CustomerFilter }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Done', value: 'DONE' },
  { label: 'Active Rentals', value: 'ACTIVE_RENTALS' },
  { label: 'Blacklisted', value: 'BLACKLISTED' },
  { label: 'All', value: 'ALL' },
];

const CustomerRow = ({
  customerId,
  onPress,
}: {
  customerId: string;
  onPress: () => void;
}) => {
  const customer = useCustomerStore(s => s.getCustomerById(customerId));
  const { activeRental, car } = useCustomerRentalInfo(customerId);
  if (!customer) return null;

  return (
    <Pressable onPress={onPress} style={[styles.card, shadows.sm]}>
      <View style={styles.cardHeader}>
        <Text style={typography.h4}>{customer.name}</Text>
        <StatusBadge
          label={activeRental?.paymentStatus ?? 'N/A'}
          variant={activeRental?.paymentStatus === 'DONE' ? 'done' : 'pending'}
        />
      </View>
      {car ? (
        <Text style={typography.bodySmall}>
          {car.name} · Due {activeRental ? formatDate(activeRental.endDate) : '—'}
        </Text>
      ) : (
        <Text style={typography.bodySmall}>No active rental</Text>
      )}
    </Pressable>
  );
};

export const CustomersListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const filtered = useFilteredCustomers();
  const filter = useCustomerStore(s => s.filter);
  const setFilter = useCustomerStore(s => s.setFilter);
  const searchQuery = useCustomerStore(s => s.searchQuery);
  const setSearchQuery = useCustomerStore(s => s.setSearchQuery);
  const filterRef = useRef<FilterBottomSheetRef>(null);
  const { hydrateAll } = useHydrateStores();

  const renderItem = useCallback(
    ({ item }: { item: (typeof filtered)[0] }) => (
      <CustomerRow
        customerId={item.id}
        onPress={() => navigation.navigate('CustomerProfile', { customerId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SearchHeader
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search customers..."
        onFilterPress={() => filterRef.current?.open()}
      />
      <SegmentedButtons
        value={filter === 'PENDING' || filter === 'DONE' ? filter : 'PENDING'}
        onValueChange={v => setFilter(v as CustomerFilter)}
        buttons={[
          { value: 'PENDING', label: 'Pending' },
          { value: 'DONE', label: 'Done' },
        ]}
        style={styles.segment}
      />
      <View style={styles.list}>
        <FlashList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          onRefresh={hydrateAll}
          refreshing={false}
          ListEmptyComponent={<EmptyState title="No customers" />}
        />
      </View>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CustomerForm', {})}
        color={colors.textInverse}
      />
      <FilterBottomSheet
        ref={filterRef}
        title="Filter Customers"
        options={FILTER_OPTIONS}
        selected={filter}
        onSelect={setFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  segment: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  list: { flex: 1, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, backgroundColor: colors.primary },
});
