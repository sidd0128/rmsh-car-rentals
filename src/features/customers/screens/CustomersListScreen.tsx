import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import type { CustomersStackParamList } from '@app/navigation/types';
import { spacing, typography, shadows, radius } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { SHOW_PAYMENTS_UI } from '@core/constants/features';
import { formatRentalEndDisplay } from '@core/helpers/rentalDisplay';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { screenStyles } from '@shared/layouts/screenStyles';
import { EmptyState, StatusBadge } from '@shared/ui';
import { SearchHeader } from '@reusable';
import { useCustomerStore } from '../store/useCustomerStore';
import { useFilteredCustomers } from '../hooks/useFilteredCustomers';
import { useCustomerRentalInfo } from '../hooks/useCustomerRentalInfo';
import {
  CustomerListPaymentBadge,
  CustomerListPaymentSubtitle,
} from '../components/CustomerListPaymentRowExtras';
import { useTranslation } from '@core/i18n';

const CustomerRow = ({
  customerId,
  onPress,
}: {
  customerId: string;
  onPress: () => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const customer = useCustomerStore(s => s.getCustomerById(customerId));
  const { activeRental, car } = useCustomerRentalInfo(customerId);
  if (!customer) return null;

  const activeCar = activeRental ? car : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, shadows.sm, { backgroundColor: colors.surface }]}
    >
      <View style={styles.cardHeader}>
        <Text style={typography.h4}>{customer.name}</Text>
        {SHOW_PAYMENTS_UI ? (
          <CustomerListPaymentBadge
            customerId={customerId}
            activeRental={activeRental}
            car={activeCar}
          />
        ) : activeRental ? (
          <StatusBadge label={t('customers.onRent')} variant="on_rent" />
        ) : null}
      </View>
      {SHOW_PAYMENTS_UI ? (
        <CustomerListPaymentSubtitle
          customerId={customerId}
          activeRental={activeRental}
          car={activeCar}
        />
      ) : activeCar ? (
        <Text style={typography.bodySmall}>
          {activeCar.name}
          {activeRental
            ? ` · ${t('customers.until', {
                date: formatRentalEndDisplay(activeRental.endDate),
              })}`
            : ''}
        </Text>
      ) : (
        <Text style={typography.bodySmall}>{t('customers.noActiveRental')}</Text>
      )}
    </Pressable>
  );
};

export const CustomersListScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const filtered = useFilteredCustomers();
  const searchQuery = useCustomerStore(s => s.searchQuery);
  const setSearchQuery = useCustomerStore(s => s.setSearchQuery);
  const { hydrateAll } = useHydrateStores();
  const { listNumColumns, horizontalPadding } = useDeviceLayout();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { paddingHorizontal: horizontalPadding }]}>
        <SearchHeader
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('customers.searchPlaceholder')}
        />
      </View>
      <View style={styles.list}>
        <FlashList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={listNumColumns}
          key={`customers-${listNumColumns}`}
          contentContainerStyle={[
            screenStyles.listContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          onRefresh={hydrateAll}
          refreshing={false}
          ListEmptyComponent={<EmptyState title={t('customers.listEmptyTitle')} />}
        />
      </View>
      <FAB
        icon="plus"
        style={[styles.fab, { right: horizontalPadding, backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CustomerForm', {})}
        color={colors.textInverse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    paddingTop: spacing.md,
  },
  list: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
  },
});
