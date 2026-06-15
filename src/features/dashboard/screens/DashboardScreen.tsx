import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  BottomTabParamList,
  DashboardStackParamList,
} from '@app/navigation/types';
import { openCarsListWithFilter } from '@features/cars/navigation/openCarsListWithFilter';
import {
  carHasUpcomingBookingOnly,
  carIsReturningSoon,
  returnsSoonFilterDescription,
} from '@core/services/availabilityService';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { getAppName } from '@core/constants/app';
import { useTranslation } from '@core/i18n';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { StatCard } from '../components/StatCard';
import { SHOW_PAYMENTS_UI } from '@core/constants/features';
import { computeFleetTotalPaid } from '@core/helpers/rentalPayments';
import { computeUpcomingEarningsTotalForYear } from '@core/helpers/upcomingEarnings';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useBookingRequestStore } from '@features/bookingRequests/store/useBookingRequestStore';
import dayjs from 'dayjs';

const RECENT_BOOKINGS_LIMIT = 5;

type DashboardNav = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList>,
  BottomTabNavigationProp<BottomTabParamList>
>;

export const DashboardScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const navigation = useNavigation<DashboardNav>();
  const insets = useSafeAreaInsets();
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const bookingRequests = useBookingRequestStore(s => s.bookingRequests);
  const { hydrateAll } = useHydrateStores();

  const stats = useMemo(() => {
    const available = cars.filter(c => c.status === 'AVAILABLE').length;
    const onRent = cars.filter(c => c.status === 'ON_RENT').length;
    const upcomingBookings = cars.filter(c =>
      carHasUpcomingBookingOnly(c, rentals),
    ).length;
    const returningSoon = cars.filter(c =>
      carIsReturningSoon(c, rentals),
    ).length;
    const totalEarnings = SHOW_PAYMENTS_UI
      ? computeFleetTotalPaid(rentals, payments)
      : 0;
    const upcomingEarnings = SHOW_PAYMENTS_UI
      ? computeUpcomingEarningsTotalForYear(payments, dayjs().year())
      : 0;
    const recent = [...rentals]
      .sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      )
      .slice(0, RECENT_BOOKINGS_LIMIT);
    const pendingBookingRequests = bookingRequests.filter(
      request => request.status === 'PENDING',
    ).length;

    return {
      available,
      onRent,
      upcomingBookings,
      returningSoon,
      totalEarnings,
      upcomingEarnings,
      recent,
      pendingBookingRequests,
    };
  }, [bookingRequests, cars, rentals, payments]);

  const onRefresh = useCallback(() => hydrateAll(), [hydrateAll]);

  return (
    <ScreenLayout
      onRefresh={onRefresh}
      style={{ paddingTop: insets.top + spacing.md }}
    >
      <Text style={[styles.brand, { color: colors.primary }]}>
        {getAppName()}
      </Text>
      <Text style={typography.h1}>{t('dashboard.title')}</Text>
      <Text style={styles.subtitle}>{t('dashboard.subtitle')}</Text>

      <View style={styles.grid}>
        <StatCard label={t('dashboard.totalCars')} value={cars.length} />
        <StatCard
          label={t('dashboard.available')}
          value={stats.available}
          accent={colors.success}
        />
        <StatCard
          label={t('dashboard.onRent')}
          value={stats.onRent}
          accent={colors.info}
        />
        <StatCard
          label={t('dashboard.returnsSoon')}
          value={stats.returningSoon}
          description={returnsSoonFilterDescription()}
          accent={colors.warning}
          onPress={() => openCarsListWithFilter(navigation, 'RETURNING_SOON')}
        />
        <StatCard
          label={t('dashboard.upcomingBookings')}
          value={stats.upcomingBookings}
          accent={colors.warning}
          onPress={() => openCarsListWithFilter(navigation, 'UPCOMING_BOOKING')}
        />
        <StatCard label={t('dashboard.customers')} value={customers.length} />
        <StatCard
          label={t('dashboard.newBookingRequests')}
          value={stats.pendingBookingRequests}
          accent={colors.primary}
          onPress={() => navigation.navigate('BookingRequests')}
        />
        {SHOW_PAYMENTS_UI ? (
          <>
            <StatCard
              label={t('dashboard.totalEarnings')}
              value={formatCurrency(stats.totalEarnings)}
              accent={colors.primary}
              onPress={() => navigation.navigate('EarningsBreakdown')}
            />
            <StatCard
              label={t('dashboard.upcomingEarningsThisYear')}
              value={formatCurrency(stats.upcomingEarnings)}
              accent={colors.secondary}
              onPress={() => navigation.navigate('UpcomingEarnings')}
            />
          </>
        ) : null}
      </View>

      <Text style={[typography.h3, styles.recentHeading]}>
        {t('dashboard.recentBookings')}
      </Text>
      <Text style={[styles.recentHint, { color: colors.textMuted }]}>
        {t('dashboard.recentBookingsHint', { count: RECENT_BOOKINGS_LIMIT })}
      </Text>
      {stats.recent.length === 0 ? (
        <Text style={[screenStyles.emptyHint, { color: colors.textMuted }]}>
          {t('dashboard.noBookingsYet')}
        </Text>
      ) : (
        stats.recent.map(r => {
          const car = cars.find(c => c.id === r.carId);
          const customer = customers.find(c => c.id === r.customerId);
          return (
            <View
              key={r.id}
              style={[
                screenStyles.surfaceCard,
                styles.recentItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text style={typography.h4}>{car?.name ?? t('common.car')}</Text>
              <Text style={typography.bodySmall}>
                {customer?.name ?? t('common.customer')} · {r.status}
              </Text>
              <Text
                style={[styles.recentDates, { color: colors.textSecondary }]}
              >
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
  brand: { ...typography.caption, marginBottom: spacing.xs },
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
    marginBottom: spacing.sm,
  },
  recentItem: {
    marginTop: spacing.md,
  },
  recentDates: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
});
