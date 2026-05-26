import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '@app/theme';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { screenStyles, LIST_BOTTOM_INSET } from '@shared/layouts/screenStyles';
import {
  EarningsCarSectionHeader,
  EarningsHireCard,
  SearchHeader,
  useDebouncedValue,
} from '@reusable';
import { computeFleetTotalPaid } from '@core/helpers/rentalPayments';
import { buildCarEarningsSections } from '../helpers/buildCarEarningsSections';
import {
  buildEarningsListItems,
  countTotalHires,
  countVisibleHires,
  type EarningsListItem,
} from '../helpers/buildEarningsListItems';
import { filterCarEarningsSections } from '../helpers/filterCarEarningsSections';

export const EarningsBreakdownScreen = () => {
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const { horizontalPadding } = useDeviceLayout();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCarId, setExpandedCarId] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  const allSections = useMemo(
    () => buildCarEarningsSections(cars, rentals, customers, payments),
    [cars, rentals, customers, payments],
  );

  const filteredSections = useMemo(
    () => filterCarEarningsSections(allSections, debouncedSearch),
    [allSections, debouncedSearch],
  );

  const isSearchActive = debouncedSearch.trim().length > 0;

  const listItems = useMemo(
    () =>
      buildEarningsListItems({
        sections: filteredSections,
        expandedCarId,
        expandAll: isSearchActive,
      }),
    [filteredSections, expandedCarId, isSearchActive],
  );

  const fleetTotal = useMemo(
    () => computeFleetTotalPaid(rentals, payments),
    [rentals, payments],
  );

  const totalHires = useMemo(() => countTotalHires(allSections), [allSections]);
  const visibleHires = useMemo(() => countVisibleHires(filteredSections), [filteredSections]);

  const toggleCarSection = useCallback((carId: string) => {
    if (isSearchActive) {
      return;
    }
    setExpandedCarId(current => (current === carId ? undefined : carId));
  }, [isSearchActive]);

  const renderItem = useCallback(
    ({ item }: { item: EarningsListItem }) => {
      if (item.kind === 'car-header') {
        const { section } = item;
        return (
          <EarningsCarSectionHeader
            carName={section.carName}
            hireCount={section.hireCount}
            totalPaid={section.totalPaid}
            totalPending={section.totalPending}
            expanded={item.expanded}
            onPress={() => toggleCarSection(section.carId)}
          />
        );
      }

      const { row } = item;
      return (
        <View style={styles.hireWrap}>
          <EarningsHireCard
            customerName={row.customerName}
            customerInitials={row.customerInitials}
            periodLabel={row.periodLabel}
            agreedPrice={row.agreedPrice}
            paidAmount={row.paidAmount}
            paymentStatus={row.paymentStatus}
          />
        </View>
      );
    },
    [toggleCarSection],
  );

  const listHeader = useMemo(
    () => (
      <View style={screenStyles.earningsHeader}>
        <Text style={screenStyles.earningsLead}>
          Fleet total received: {formatCurrency(fleetTotal)}
        </Text>
        <Text style={screenStyles.earningsHint}>
          Totals reflect customer payments per rental. Tap a car to expand hires.
        </Text>
        {isSearchActive ? (
          <Text style={screenStyles.earningsMeta}>
            Showing {visibleHires} matching {visibleHires === 1 ? 'hire' : 'hires'} of {totalHires}{' '}
            total
          </Text>
        ) : (
          <Text style={screenStyles.earningsMeta}>
            {totalHires} hires across {allSections.length} cars
          </Text>
        )}
      </View>
    ),
    [fleetTotal, isSearchActive, visibleHires, totalHires, allSections.length],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding }]}>
        {listHeader}
        <SearchHeader
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search customer, car, or dates..."
        />
      </View>

      <View style={styles.list}>
        <FlashList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={item => item.key}
          getItemType={item => item.kind}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          extraData={{ expandedCarId, debouncedSearch }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isSearchActive
                ? 'No hires match your search.'
                : 'No rental hires recorded yet.'}
            </Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: LIST_BOTTOM_INSET,
  },
  hireWrap: {
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  empty: {
    color: colors.textMuted,
    marginTop: spacing.xxl,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});
