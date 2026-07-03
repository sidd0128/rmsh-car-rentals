import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDate } from '@core/helpers/date';
import { useTranslation } from '@core/i18n';
import {
  AppButton,
  AppDatePickerModal,
  AppDropdown,
  SearchBar,
} from '@shared/ui';
import type { DropdownOption } from '@shared/ui';
import type {
  AuditLogDateFilter,
  AuditLogDatePickerTarget,
  AuditLogSortFilter,
  AuditLogTargetFilter,
} from '../helpers/deletionAuditLogFilters';

interface DeletionAuditLogFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  targetFilter: AuditLogTargetFilter;
  onTargetFilterChange: (value: AuditLogTargetFilter) => void;
  actorFilter: string;
  onActorFilterChange: (value: string) => void;
  dateFilter: AuditLogDateFilter;
  onDateFilterChange: (value: AuditLogDateFilter) => void;
  sortFilter: AuditLogSortFilter;
  onSortFilterChange: (value: AuditLogSortFilter) => void;
  customStartDate: Date;
  customEndDate: Date;
  datePickerTarget: AuditLogDatePickerTarget;
  onOpenDatePicker: (target: Exclude<AuditLogDatePickerTarget, null>) => void;
  onCloseDatePicker: () => void;
  onConfirmDate: (date: Date) => void;
  actorOptions: DropdownOption<string>[];
  shownCount: number;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const DeletionAuditLogFilters = memo<DeletionAuditLogFiltersProps>(
  ({
    searchQuery,
    onSearchQueryChange,
    targetFilter,
    onTargetFilterChange,
    actorFilter,
    onActorFilterChange,
    dateFilter,
    onDateFilterChange,
    sortFilter,
    onSortFilterChange,
    customStartDate,
    customEndDate,
    datePickerTarget,
    onOpenDatePicker,
    onCloseDatePicker,
    onConfirmDate,
    actorOptions,
    shownCount,
    filteredCount,
    totalCount,
    hasActiveFilters,
    onResetFilters,
  }) => {
    const { colors } = useThemeContext();
    const { t } = useTranslation();

    const targetOptions: DropdownOption<AuditLogTargetFilter>[] = [
      { label: t('security.auditLog.filters.allTargets'), value: 'ALL' },
      { label: t('security.auditLog.target.car'), value: 'CAR' },
      { label: t('security.auditLog.target.customer'), value: 'CUSTOMER' },
    ];
    const dateOptions: DropdownOption<AuditLogDateFilter>[] = [
      { label: t('security.auditLog.filters.allDates'), value: 'ALL' },
      { label: t('security.auditLog.filters.today'), value: 'TODAY' },
      { label: t('security.auditLog.filters.last7Days'), value: 'LAST_7_DAYS' },
      {
        label: t('security.auditLog.filters.last30Days'),
        value: 'LAST_30_DAYS',
      },
      { label: t('security.auditLog.filters.customRange'), value: 'CUSTOM' },
    ];
    const sortOptions: DropdownOption<AuditLogSortFilter>[] = [
      { label: t('security.auditLog.filters.newestFirst'), value: 'NEWEST' },
      { label: t('security.auditLog.filters.oldestFirst'), value: 'OLDEST' },
    ];

    const selectedTargetLabel =
      targetOptions.find(option => option.value === targetFilter)?.label ??
      t('security.auditLog.filters.allTargets');
    const selectedDateLabel =
      dateOptions.find(option => option.value === dateFilter)?.label ??
      t('security.auditLog.filters.allDates');
    const selectedSortLabel =
      sortOptions.find(option => option.value === sortFilter)?.label ??
      t('security.auditLog.filters.newestFirst');
    const selectedActorLabel =
      actorOptions.find(option => option.value === actorFilter)?.label ??
      t('security.auditLog.filters.allUsers');
    const pickerDate =
      datePickerTarget === 'START' ? customStartDate : customEndDate;

    return (
      <View style={styles.header}>
        <Text style={typography.h2}>{t('security.auditLog.title')}</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          {t('security.auditLog.subtitle')}
        </Text>
        <SearchBar
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder={t('security.auditLog.filters.searchPlaceholder')}
        />
        <View style={styles.filters}>
          <AppDropdown
            label={t('security.auditLog.filters.targetButton', {
              value: selectedTargetLabel,
            })}
            options={targetOptions}
            onSelect={onTargetFilterChange}
            fullWidth
          />
          <AppDropdown
            label={t('security.auditLog.filters.userButton', {
              value: selectedActorLabel,
            })}
            options={actorOptions}
            onSelect={onActorFilterChange}
            searchable
            searchPlaceholder={t('security.auditLog.filters.searchUsers')}
            emptySearchMessage={t('security.auditLog.filters.noUsersFound')}
            fullWidth
          />
          <AppDropdown
            label={t('security.auditLog.filters.dateButton', {
              value: selectedDateLabel,
            })}
            options={dateOptions}
            onSelect={onDateFilterChange}
            fullWidth
          />
          <AppDropdown
            label={t('security.auditLog.filters.sortButton', {
              value: selectedSortLabel,
            })}
            options={sortOptions}
            onSelect={onSortFilterChange}
            fullWidth
          />
        </View>
        {dateFilter === 'CUSTOM' ? (
          <View style={styles.customDateRow}>
            <AppButton
              label={t('security.auditLog.filters.fromDate', {
                date: formatDate(customStartDate.toISOString()),
              })}
              variant="outline"
              onPress={() => onOpenDatePicker('START')}
              style={styles.dateButton}
            />
            <AppButton
              label={t('security.auditLog.filters.toDate', {
                date: formatDate(customEndDate.toISOString()),
              })}
              variant="outline"
              onPress={() => onOpenDatePicker('END')}
              style={styles.dateButton}
            />
          </View>
        ) : null}
        <View style={styles.resultRow}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {t('security.auditLog.filters.resultCount', {
              shown: shownCount,
              filtered: filteredCount,
              total: totalCount,
            })}
          </Text>
          {hasActiveFilters ? (
            <AppButton
              label={t('security.auditLog.filters.reset')}
              variant="outline"
              onPress={onResetFilters}
            />
          ) : null}
        </View>
        <AppDatePickerModal
          open={datePickerTarget !== null}
          date={pickerDate}
          maximumDate={datePickerTarget === 'START' ? customEndDate : undefined}
          minimumDate={datePickerTarget === 'END' ? customStartDate : undefined}
          onCancel={onCloseDatePicker}
          onConfirm={onConfirmDate}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filters: {
    gap: spacing.sm,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
