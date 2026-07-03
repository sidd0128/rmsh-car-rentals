import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { getScreenBottomClearance } from '@core/helpers/screenBottomInset';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useOptionalBottomTabBarHeight } from '@core/hooks/useOptionalBottomTabBarHeight';
import { useTranslation } from '@core/i18n';
import type { DeletionAuditLog } from '@core/types/domain';
import { screenStyles } from '@shared/layouts/screenStyles';
import { EmptyState } from '@shared/ui';
import type { DropdownOption } from '@shared/ui';
import { DeletionAuditLogCard } from '../components/DeletionAuditLogCard';
import { DeletionAuditLogFilters } from '../components/DeletionAuditLogFilters';
import {
  ALL_AUDIT_LOG_ACTORS,
  AUDIT_LOG_PAGE_SIZE,
  auditLogHasActiveFilters,
  filterAndSortAuditLogs,
  getAuditLogActorLabel,
  type AuditLogDateFilter,
  type AuditLogDatePickerTarget,
  type AuditLogFilters,
  type AuditLogSortFilter,
  type AuditLogTargetFilter,
} from '../helpers/deletionAuditLogFilters';
import { useDeletionAuditLogStore } from '../store/useDeletionAuditLogStore';

export const DeletionAuditLogsScreen = () => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const { horizontalPadding } = useDeviceLayout();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useOptionalBottomTabBarHeight();
  const logs = useDeletionAuditLogStore(s => s.logs);
  const hydrate = useDeletionAuditLogStore(s => s.hydrate);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState<AuditLogTargetFilter>('ALL');
  const [actorFilter, setActorFilter] = useState(ALL_AUDIT_LOG_ACTORS);
  const [dateFilter, setDateFilter] = useState<AuditLogDateFilter>('ALL');
  const [sortFilter, setSortFilter] = useState<AuditLogSortFilter>('NEWEST');
  const [customStartDate, setCustomStartDate] = useState(
    dayjs().subtract(30, 'day').toDate(),
  );
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [datePickerTarget, setDatePickerTarget] =
    useState<AuditLogDatePickerTarget>(null);
  const [visibleCount, setVisibleCount] = useState(AUDIT_LOG_PAGE_SIZE);

  useFocusEffect(
    useCallback(() => {
      hydrate().catch(() => undefined);
    }, [hydrate]),
  );

  const filters: AuditLogFilters = useMemo(
    () => ({
      searchQuery,
      targetFilter,
      actorFilter,
      dateFilter,
      sortFilter,
      customStartDate,
      customEndDate,
    }),
    [
      actorFilter,
      customEndDate,
      customStartDate,
      dateFilter,
      searchQuery,
      sortFilter,
      targetFilter,
    ],
  );

  const actorOptions = useMemo<DropdownOption<string>[]>(() => {
    const actors = Array.from(
      new Set(logs.map(log => getAuditLogActorLabel(log, t))),
    ).sort((a, b) => a.localeCompare(b));

    return [
      {
        label: t('security.auditLog.filters.allUsers'),
        value: ALL_AUDIT_LOG_ACTORS,
      },
      ...actors.map(actor => ({ label: actor, value: actor })),
    ];
  }, [logs, t]);

  const filteredLogs = useMemo(
    () => filterAndSortAuditLogs(logs, filters, t),
    [filters, logs, t],
  );

  useEffect(() => {
    setVisibleCount(AUDIT_LOG_PAGE_SIZE);
  }, [filters]);

  const visibleLogs = useMemo(
    () => filteredLogs.slice(0, visibleCount),
    [filteredLogs, visibleCount],
  );

  const hasActiveFilters = auditLogHasActiveFilters(filters);

  const resetFilters = () => {
    setSearchQuery('');
    setTargetFilter('ALL');
    setActorFilter(ALL_AUDIT_LOG_ACTORS);
    setDateFilter('ALL');
    setSortFilter('NEWEST');
  };

  const handleConfirmDate = (date: Date) => {
    if (datePickerTarget === 'START') {
      setCustomStartDate(date);
    } else {
      setCustomEndDate(date);
    }
    setDatePickerTarget(null);
  };

  const handleEndReached = () => {
    if (visibleCount >= filteredLogs.length) {
      return;
    }

    setVisibleCount(count =>
      Math.min(count + AUDIT_LOG_PAGE_SIZE, filteredLogs.length),
    );
  };

  const renderLog = useCallback(
    ({ item }: { item: DeletionAuditLog }) => (
      <DeletionAuditLogCard log={item} />
    ),
    [],
  );

  const listHeader = (
    <DeletionAuditLogFilters
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      targetFilter={targetFilter}
      onTargetFilterChange={setTargetFilter}
      actorFilter={actorFilter}
      onActorFilterChange={setActorFilter}
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
      sortFilter={sortFilter}
      onSortFilterChange={setSortFilter}
      customStartDate={customStartDate}
      customEndDate={customEndDate}
      datePickerTarget={datePickerTarget}
      onOpenDatePicker={setDatePickerTarget}
      onCloseDatePicker={() => setDatePickerTarget(null)}
      onConfirmDate={handleConfirmDate}
      actorOptions={actorOptions}
      shownCount={visibleLogs.length}
      filteredCount={filteredLogs.length}
      totalCount={logs.length}
      hasActiveFilters={hasActiveFilters}
      onResetFilters={resetFilters}
    />
  );

  const emptyState =
    logs.length === 0 ? (
      <EmptyState
        title={t('security.auditLog.emptyTitle')}
        description={t('security.auditLog.emptyDescription')}
      />
    ) : (
      <EmptyState
        title={t('security.auditLog.filters.noResultsTitle')}
        description={t('security.auditLog.filters.noResultsDescription')}
      />
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={visibleLogs}
        renderItem={renderLog}
        keyExtractor={item => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        onRefresh={hydrate}
        refreshing={false}
        contentContainerStyle={[
          screenStyles.listContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: getScreenBottomClearance(
              tabBarHeight,
              insets.bottom,
            ),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
