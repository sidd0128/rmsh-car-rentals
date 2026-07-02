import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HistoryStackParamList } from '@app/navigation/types';
import { spacing, typography } from '@app/theme';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { CarCard } from '@features/cars/components/CarCard';
import { screenStyles } from '@shared/layouts/screenStyles';
import { EmptyState, SearchHeader } from '@shared/ui';
import { useHistoryFilteredCars } from '../hooks/useHistoryFilteredCars';
import { useTranslation } from '@core/i18n';

export const HistoryCarsListScreen = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCars = useHistoryFilteredCars(searchQuery);
  const customers = useCustomerStore(s => s.customers);
  const { hydrateAll } = useHydrateStores();
  const { listNumColumns, horizontalPadding } = useDeviceLayout();
  const insets = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredCars)[0] }) => {
      const customerId = item.currentBooking?.customerId;
      const customer = customers.find(c => c.id === customerId);
      return (
        <CarCard
          car={item}
          customer={customer}
          totalPaid={0}
          hidePaymentInfo
          onPress={() =>
            navigation.navigate('CarRentalHistory', { carId: item.id })
          }
        />
      );
    },
    [customers, navigation],
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.toolbar,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: insets.top + spacing.md,
          },
        ]}
      >
        <Text style={typography.h2}>{t('history.title')}</Text>
        <Text style={typography.bodySmall}>{t('history.subtitle')}</Text>
        <SearchHeader
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('cars.searchPlaceholder')}
        />
      </View>
      <FlashList
        data={filteredCars}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={listNumColumns}
        contentContainerStyle={[
          screenStyles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        onRefresh={hydrateAll}
        refreshing={false}
        ListEmptyComponent={
          <EmptyState
            title={t('cars.noCarsFound')}
            description={t('common.tryChangeFilters')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
