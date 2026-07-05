import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import type { BottomTabParamList, DashboardStackParamList } from '@app/navigation/types';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { computeFleetTotalPaid } from '@core/helpers/rentalPayments';
import { computeUpcomingEarningsTotalForYear } from '@core/helpers/upcomingEarnings';
import { formatCurrency } from '@core/utils/currency';
import type { Rental } from '@core/types/domain';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { getDuePendingRentPayments } from '@features/rentDue/helpers/rentDueSections';
import { StatCard } from './StatCard';
import { useTranslation } from '@core/i18n';

type DashboardNav = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList>,
  BottomTabNavigationProp<BottomTabParamList>
>;

interface DashboardPaymentStatCardsProps {
  rentals: Rental[];
  navigation: DashboardNav;
}

/** Earnings stat cards — only mounted when `SHOW_PAYMENTS_UI` is enabled. */
export const DashboardPaymentStatCards = ({
  rentals,
  navigation,
}: DashboardPaymentStatCardsProps) => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const payments = usePaymentStore(s => s.payments);

  const { totalEarnings, upcomingEarnings } = useMemo(
    () => ({
      totalEarnings: computeFleetTotalPaid(rentals, payments),
      upcomingEarnings: computeUpcomingEarningsTotalForYear(payments, dayjs().year()),
    }),
    [rentals, payments],
  );
  const dueRentCount = useMemo(
    () => getDuePendingRentPayments(payments).length,
    [payments],
  );

  return (
    <>
      <StatCard
        label={t('dashboard.rentDue')}
        value={dueRentCount}
        accent={colors.error}
        onPress={() => navigation.navigate('RentDue')}
      />
      <StatCard
        label={t('dashboard.totalEarnings')}
        value={formatCurrency(totalEarnings)}
        accent={colors.primary}
        onPress={() => navigation.navigate('EarningsBreakdown')}
      />
      <StatCard
        label={t('dashboard.upcomingEarningsThisYear')}
        value={formatCurrency(upcomingEarnings)}
        accent={colors.secondary}
        onPress={() => navigation.navigate('UpcomingEarnings')}
      />
    </>
  );
};
