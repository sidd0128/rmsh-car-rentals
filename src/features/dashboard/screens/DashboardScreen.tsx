import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabParamList, DashboardStackParamList } from '@app/navigation/types';
import { openCarsListWithFilter } from '@features/cars/navigation/openCarsListWithFilter';
import { carHasUpcomingBookingOnly } from '@core/services/availabilityService';
import { colors, spacing, typography } from '@app/theme';
import { APP_NAME } from '@core/constants/app';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { StatCard } from '../components/StatCard';
import { computeFleetTotalPaid } from '@core/helpers/rentalPayments';
import { computeUpcomingEarningsTotalForYear } from '@core/helpers/upcomingEarnings';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import dayjs from 'dayjs';

/** Max rentals shown in the dashboard “Recent Bookings” section. */
export const RECENT_BOOKINGS_LIMIT = 5;

type DashboardNav = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList>,
  BottomTabNavigationProp<BottomTabParamList>
>;

export const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNav>();
  const insets = useSafeAreaInsets();
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const { hydrateAll } = useHydrateStores();

  const stats = useMemo(() => {
    const available = cars.filter(c => c.status === 'AVAILABLE').length;
    const onRent = cars.filter(c => c.status === 'ON_RENT').length;
    const upcomingBookings = cars.filter(c => carHasUpcomingBookingOnly(c, rentals)).length;
    const upcomingReturns = rentals.filter(
      r =>
        r.status === 'ACTIVE' &&
        dayjs(r.endDate).diff(dayjs(), 'day') <= 3,
    ).length;
    const totalEarnings = computeFleetTotalPaid(rentals, payments);
    const upcomingEarnings = computeUpcomingEarningsTotalForYear(payments, dayjs().year());
    const recent = [...rentals]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, RECENT_BOOKINGS_LIMIT);

    return {
      available,
      onRent,
      upcomingBookings,
      upcomingReturns,
      totalEarnings,
      upcomingEarnings,
      recent,
    };
  }, [cars, rentals, payments]);

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
        <StatCard
          label="Upcoming Bookings"
          value={stats.upcomingBookings}
          accent={colors.warning}
          onPress={() => openCarsListWithFilter(navigation, 'UPCOMING_BOOKING')}
        />
        <StatCard label="Customers" value={customers.length} />
        <StatCard
          label="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
          accent={colors.primary}
          onPress={() => navigation.navigate('EarningsBreakdown')}
        />
        <StatCard
          label="Upcoming earnings this year"
          value={formatCurrency(stats.upcomingEarnings)}
          accent={colors.secondary}
          onPress={() => navigation.navigate('UpcomingEarnings')}
        />
      </View>

      <Text style={[typography.h3, styles.recentHeading]}>Recent Bookings</Text>
      <Text style={styles.recentHint}>
        {RECENT_BOOKINGS_LIMIT} most recently created bookings
      </Text>
      {stats.recent.length === 0 ? (
        <Text style={screenStyles.emptyHint}>No bookings yet.</Text>
      ) : (
        stats.recent.map(r => {
          const car = cars.find(c => c.id === r.carId);
          const customer = customers.find(c => c.id === r.customerId);
          return (
            <View key={r.id} style={[screenStyles.surfaceCard, styles.recentItem]}>
              <Text style={typography.h4}>{car?.name ?? 'Car'}</Text>
              <Text style={typography.bodySmall}>
                {customer?.name ?? 'Customer'} · {r.status}
              </Text>
              <Text style={styles.recentDates}>
                {formatDate(r.startDate)} – {formatDate(r.endDate)}
              </Text>
            </View>
          );
        })
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  brand: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, marginBottom: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  recentHeading: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  recentHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  recentItem: {
    marginTop: spacing.md,
  },
  recentDates: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
