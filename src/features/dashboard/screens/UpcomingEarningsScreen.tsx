import React, { useCallback, useMemo, useRef, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import dayjs from 'dayjs';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import {
  computeUpcomingEarningsTotalForYear,
  getUpcomingEarningsYearOptions,
  groupPendingPaymentsByMonthForYear,
} from '@core/helpers/upcomingEarnings';
import { formatInstallmentDueLabel } from '@core/helpers/paymentInstallment';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { formatCurrency } from '@core/utils/currency';
import { formatDate } from '@core/helpers/date';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentInstallmentActions } from '@features/payments/hooks/usePaymentInstallmentActions';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { FilterBottomSheet, FilterBottomSheetRef } from '@shared/bottomSheets/FilterBottomSheet';
import { screenStyles, LIST_BOTTOM_INSET } from '@shared/layouts/screenStyles';
import { AppButton, PaymentInstallmentActions } from '@shared/ui';
import type { PaymentRecord } from '@core/types/domain';
import { useTranslation } from '@core/i18n';

type MonthSection = {
  key: string;
  title: string;
  totalAmount: number;
  data: PaymentRecord[];
};

const SectionSpacer = () => <View style={styles.sectionSpacer} />;

export const UpcomingEarningsScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const payments = usePaymentStore(s => s.payments);
  const rentals = useRentalStore(s => s.rentals);
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);
  const { horizontalPadding } = useDeviceLayout();
  const { actingId, actingKind, runAction } = usePaymentInstallmentActions();
  const filterRef = useRef<FilterBottomSheetRef>(null);
  const [selectedYear, setSelectedYear] = useState(() => dayjs().year());

  const yearOptions = useMemo(() => getUpcomingEarningsYearOptions(payments), [payments]);

  const yearFilterOptions = useMemo(
    () => yearOptions.map(year => ({ label: String(year), value: String(year) })),
    [yearOptions],
  );

  const monthSections = useMemo(
    () => groupPendingPaymentsByMonthForYear(payments, selectedYear),
    [payments, selectedYear],
  );

  const sections = useMemo<MonthSection[]>(
    () =>
      monthSections.map(section => ({
        key: section.key,
        title: section.title,
        totalAmount: section.totalAmount,
        data: section.payments,
      })),
    [monthSections],
  );

  const yearTotal = useMemo(
    () => computeUpcomingEarningsTotalForYear(payments, selectedYear),
    [payments, selectedYear],
  );

  const paymentCount = useMemo(
    () => monthSections.reduce((sum, section) => sum + section.payments.length, 0),
    [monthSections],
  );

  const onReceived = useCallback(
    (paymentId: string) => {
      runAction(paymentId, 'received').catch(() => undefined);
    },
    [runAction],
  );

  const onNotPaid = useCallback(
    (paymentId: string) => {
      runAction(paymentId, 'not_paid').catch(() => undefined);
    },
    [runAction],
  );

  const renderItem = useCallback(
    ({ item }: { item: PaymentRecord }) => {
      const rental = rentals.find(r => r.id === item.rentalId);
      const customer = customers.find(c => c.id === item.customerId);
      const car = cars.find(c => c.id === item.carId);

      return (
        <View
          style={[
            screenStyles.surfaceCard,
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <Text style={typography.h4}>{customer?.name ?? t('common.customer')}</Text>
          <Text style={typography.bodySmall}>{car?.name ?? t('common.car')}</Text>
          <Text style={[styles.installment, { color: colors.textSecondary }]}>
            {item.label ?? t('upcomingEarnings.installmentFallback')}
          </Text>
          <Text style={[styles.dueLine, { color: colors.primary }]}>
            {formatInstallmentDueLabel(item)}
          </Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {formatCurrency(item.amount)}
          </Text>
          {rental ? (
            <Text style={typography.caption}>
              {t('upcomingEarnings.contractLine', {
                amount: formatCurrency(rental.agreedPrice),
                startDate: formatDate(rental.startDate),
                endDate: formatDate(rental.endDate),
              })}
            </Text>
          ) : null}
          <PaymentInstallmentActions
            status={item.status}
            paymentId={item.id}
            actingId={actingId}
            actingKind={actingKind}
            onReceived={onReceived}
            onNotPaid={onNotPaid}
          />
        </View>
      );
    },
    [rentals, customers, cars, actingId, actingKind, onReceived, onNotPaid, colors, t],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: MonthSection }) => (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>{section.title}</Text>
        <Text style={[styles.sectionTotal, { color: colors.textSecondary }]}>
          {formatCurrency(section.totalAmount)}
        </Text>
      </View>
    ),
    [colors],
  );

  const listHeader = useMemo(
    () => (
      <View style={screenStyles.earningsHeader}>
        <Text style={[screenStyles.earningsLead, { color: colors.primary }]}>
          {t('upcomingEarnings.yearDue', {
            year: selectedYear,
            amount: formatCurrency(yearTotal),
          })}
        </Text>
        <Text style={[screenStyles.earningsHint, { color: colors.textSecondary }]}>
          {t('upcomingEarnings.hint')}
        </Text>
        <Text style={[screenStyles.earningsMeta, { color: colors.textMuted }]}>
          {t('upcomingEarnings.upcomingPaymentsInYear', {
            count: paymentCount,
            year: selectedYear,
          })}
        </Text>
      </View>
    ),
    [selectedYear, yearTotal, paymentCount, colors, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding }]}>
        <AppButton
          label={t('common.yearButton', { year: selectedYear })}
          variant="outline"
          onPress={() => filterRef.current?.open()}
          fullWidth
        />
        {listHeader}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        SectionSeparatorComponent={SectionSpacer}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        ListEmptyComponent={
          <Text style={[screenStyles.emptyHint, { color: colors.textMuted }]}>
            {t('upcomingEarnings.noPendingForYear', { year: selectedYear })}
          </Text>
        }
      />
      <FilterBottomSheet
        ref={filterRef}
        title={t('upcomingEarnings.selectYear')}
        options={yearFilterOptions}
        selected={String(selectedYear)}
        onSelect={value => setSelectedYear(Number(value))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: LIST_BOTTOM_INSET,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionTotal: {
    ...typography.label,
  },
  sectionSpacer: {
    height: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  installment: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  dueLine: {
    ...typography.label,
  },
  amount: {
    ...typography.h3,
    marginVertical: spacing.xs,
  },
});
