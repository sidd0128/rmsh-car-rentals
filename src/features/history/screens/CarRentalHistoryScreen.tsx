import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import dayjs from 'dayjs';
import type { HistoryStackParamList } from '@app/navigation/types';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTimeAmPm } from '@core/helpers/date';
import {
  buildHistoryYearOptions,
  buildMonthlyRentalBuckets,
  monthTimelineKey,
  type MonthTimelineEntry,
} from '@core/helpers/rentalHistory';
import { formatRentalDurationWeeks, formatRentalEndDisplay } from '@core/helpers/rentalDisplay';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { HistoryMonthAccordion } from '@features/history/components/HistoryMonthAccordion';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { FilterBottomSheet, FilterBottomSheetRef } from '@shared/bottomSheets/FilterBottomSheet';
import { AppButton, EmptyState } from '@shared/ui';
import { useTranslation } from '@core/i18n';

const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

const defaultExpandedMonthKeys = (
  buckets: { month: number }[],
  selectedYear: number,
  currentYear: number,
): Set<string> => {
  if (buckets.length === 0) {
    return new Set();
  }
  const currentMonth = dayjs().month() + 1;
  const match =
    selectedYear === currentYear
      ? buckets.find(b => b.month === currentMonth)
      : undefined;
  const month = match?.month ?? buckets[0]!.month;
  return new Set([monthTimelineKey(selectedYear, month)]);
};

export const CarRentalHistoryScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const route = useRoute<RouteProp<HistoryStackParamList, 'CarRentalHistory'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const car = useCarStore(s => s.getCarById(route.params.carId));
  const rentals = useRentalStore(s => s.rentals);
  const customers = useCustomerStore(s => s.customers);
  const { hydrateAll } = useHydrateStores();
  const currentYear = dayjs().year();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const yearFilterRef = useRef<FilterBottomSheetRef>(null);

  const carRentals = useMemo(
    () => rentals.filter(r => r.carId === route.params.carId),
    [rentals, route.params.carId],
  );

  const monthNames = useMemo(
    () => MONTH_KEYS.map(key => t(`history.months.${key}`)),
    [t],
  );

  const yearOptions = useMemo(
    () => buildHistoryYearOptions(carRentals, currentYear),
    [carRentals, currentYear],
  );

  const yearFilterOptions = useMemo(
    () => yearOptions.map(year => ({ label: String(year), value: String(year) })),
    [yearOptions],
  );

  const minYear = yearOptions[yearOptions.length - 1] ?? currentYear;
  const canGoToOlderYear = selectedYear > minYear;
  const canGoToNewerYear = selectedYear < currentYear;

  const monthlyBuckets = useMemo(
    () => buildMonthlyRentalBuckets(carRentals, selectedYear, monthNames),
    [carRentals, selectedYear, monthNames],
  );

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() =>
    defaultExpandedMonthKeys(monthlyBuckets, selectedYear, currentYear),
  );

  useEffect(() => {
    setExpandedMonths(defaultExpandedMonthKeys(monthlyBuckets, selectedYear, currentYear));
  }, [selectedYear, monthlyBuckets, currentYear]);

  const toggleMonth = useCallback((month: number) => {
    const key = monthTimelineKey(selectedYear, month);
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, [selectedYear]);

  useEffect(() => {
    if (car) {
      navigation.setOptions({ title: car.name });
    }
  }, [car, navigation]);

  const renderTimelineEntry = (entry: MonthTimelineEntry) => {
    if (!car) {
      return null;
    }
    if (entry.kind === 'free') {
      return (
        <View key={`free-${entry.start}`} style={styles.entry}>
          <Text style={[styles.freeLabel, { color: colors.success }]}>
            {t('history.carWasFree')}
          </Text>
          <Text style={[styles.freePeriod, { color: colors.textSecondary }]}>
            {t('history.freePeriod', {
              start: formatDateTimeAmPm(entry.start),
              end: formatDateTimeAmPm(entry.end),
            })}
          </Text>
        </View>
      );
    }

    const rental = entry.rental;
    const customer = customers.find(c => c.id === rental.customerId);
    return (
      <View key={rental.id} style={styles.entry}>
        <Text style={typography.body}>
          {t('history.rentalLineTitle', {
            car: car.name,
            plate: car.numberPlate,
            customer: customer?.name ?? t('common.customer'),
          })}
        </Text>
        <Text style={typography.bodySmall}>
          {t('history.rentalLinePeriod', {
            start: formatDateTimeAmPm(rental.startDate),
            end: formatRentalEndDisplay(rental.endDate),
          })}
        </Text>
        <Text style={[styles.duration, { color: colors.primary }]}>
          {t('history.totalDuration', {
            duration: formatRentalDurationWeeks(rental.startDate, rental.endDate),
          })}
        </Text>
      </View>
    );
  };

  if (!car) {
    return (
      <ScreenLayout>
        <Text>{t('cars.notFound')}</Text>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout onRefresh={hydrateAll}>
      <View style={styles.yearRow}>
        <IconButton
          icon="chevron-left"
          iconColor={canGoToOlderYear ? colors.primary : colors.textMuted}
          size={28}
          disabled={!canGoToOlderYear}
          onPress={() => setSelectedYear(y => y - 1)}
          accessibilityLabel={t('history.previousYear')}
        />
        <View style={styles.yearCenter}>
          <AppButton
            label={t('common.yearButton', { year: selectedYear })}
            variant="outline"
            onPress={() => yearFilterRef.current?.open()}
          />
          <Text style={[styles.yearHint, { color: colors.textMuted }]}>
            {t('history.tapToChangeYear')}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          iconColor={canGoToNewerYear ? colors.primary : colors.textMuted}
          size={28}
          disabled={!canGoToNewerYear}
          onPress={() => setSelectedYear(y => y + 1)}
          accessibilityLabel={t('history.nextYear')}
        />
      </View>

      <Text style={typography.bodySmall}>
        {car.brand} {car.model} · {car.numberPlate}
      </Text>

      {monthlyBuckets.length === 0 ? (
        <EmptyState
          title={t('history.noRentalsInYear', { year: selectedYear })}
          description={t('history.tryAnotherYear')}
        />
      ) : (
        monthlyBuckets.map(bucket => {
          const key = monthTimelineKey(selectedYear, bucket.month);
          return (
            <HistoryMonthAccordion
              key={key}
              monthLabel={bucket.monthLabel}
              timeline={bucket.timeline}
              expanded={expandedMonths.has(key)}
              onToggle={() => toggleMonth(bucket.month)}
            >
              {bucket.timeline.map(entry => renderTimelineEntry(entry))}
            </HistoryMonthAccordion>
          );
        })
      )}

      <FilterBottomSheet
        ref={yearFilterRef}
        title={t('history.selectYear')}
        options={yearFilterOptions}
        selected={String(selectedYear)}
        onSelect={value => setSelectedYear(Number(value))}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  yearCenter: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  yearHint: {
    ...typography.caption,
    textAlign: 'center',
  },
  entry: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  duration: {
    ...typography.label,
  },
  freeLabel: {
    ...typography.label,
  },
  freePeriod: {
    ...typography.bodySmall,
  },
});
