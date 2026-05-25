import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@app/theme';
import { APP_NAME } from '@core/constants/app';
import { formatCurrency } from '@core/utils/currency';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { StatCard } from '../components/StatCard';
import dayjs from 'dayjs';

export const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const { hydrateAll } = useHydrateStores();

  const stats = useMemo(() => {
    const available = cars.filter(c => c.status === 'AVAILABLE').length;
    const onRent = cars.filter(c => c.status === 'ON_RENT').length;
    const upcomingReturns = rentals.filter(
      r =>
        r.status === 'ACTIVE' &&
        dayjs(r.endDate).diff(dayjs(), 'day') <= 3,
    ).length;
    const totalEarnings = cars.reduce((s, c) => s + c.totalEarnings, 0);
    const recent = [...rentals]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, 5);

    return { available, onRent, upcomingReturns, totalEarnings, recent };
  }, [cars, rentals]);

  const onRefresh = useCallback(() => hydrateAll(), [hydrateAll]);

  return (
    <ScreenLayout onRefresh={onRefresh} style={{ paddingTop: insets.top + spacing.md }}>
      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={typography.h1}>Dashboard</Text>
      <Text style={styles.subtitle}>Fleet overview at a glance</Text>

      <View style={styles.grid}>
        <StatCard label="Total Cars" value={cars.length} />
        <StatCard label="Available" value={stats.available} accent={colors.success} />
        <StatCard label="On Rent" value={stats.onRent} accent={colors.info} />
        <StatCard label="Returns Soon" value={stats.upcomingReturns} accent={colors.warning} />
        <StatCard label="Customers" value={customers.length} />
        <StatCard
          label="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
          accent={colors.primary}
        />
      </View>

      <Text style={typography.h3}>Recent Bookings</Text>
      {stats.recent.map(r => {
        const car = cars.find(c => c.id === r.carId);
        const customer = customers.find(c => c.id === r.customerId);
        return (
          <View key={r.id} style={styles.recentItem}>
            <Text style={typography.h4}>{car?.name ?? 'Car'}</Text>
            <Text style={typography.bodySmall}>
              {customer?.name} · {r.status}
            </Text>
          </View>
        );
      })}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  brand: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginVertical: spacing.lg },
  recentItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
});
