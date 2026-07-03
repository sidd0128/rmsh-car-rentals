import dayjs from 'dayjs';
import { formatDateTime } from '@core/helpers/date';
import type { DeletionAuditLog } from '@core/types/domain';

export type AuditLogTargetFilter = 'ALL' | 'CAR' | 'CUSTOMER';
export type AuditLogDateFilter =
  | 'ALL'
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'CUSTOM';
export type AuditLogSortFilter = 'NEWEST' | 'OLDEST';
export type AuditLogDatePickerTarget = 'START' | 'END' | null;
export type Translate = (
  scope: string,
  options?: Record<string, string | number | boolean>,
) => string;

export const ALL_AUDIT_LOG_ACTORS = 'ALL';
export const AUDIT_LOG_PAGE_SIZE = 25;

export interface AuditLogFilters {
  searchQuery: string;
  targetFilter: AuditLogTargetFilter;
  actorFilter: string;
  dateFilter: AuditLogDateFilter;
  sortFilter: AuditLogSortFilter;
  customStartDate: Date;
  customEndDate: Date;
}

export const getAuditLogActorLabel = (
  log: DeletionAuditLog,
  t: Translate,
): string =>
  log.deletedByEmail ?? log.deletedByUid ?? t('security.auditLog.unknownUser');

export const getAuditLogTargetLabel = (
  targetType: DeletionAuditLog['targetType'],
  t: Translate,
): string =>
  t(
    targetType === 'CAR'
      ? 'security.auditLog.target.car'
      : 'security.auditLog.target.customer',
  );

export const formatAuditLogDeletedCounts = (
  counts: DeletionAuditLog['deletedCounts'],
  t: Translate,
): string =>
  [
    counts.cars
      ? t('security.auditLog.counts.cars', { count: counts.cars })
      : null,
    counts.customers
      ? t('security.auditLog.counts.customers', { count: counts.customers })
      : null,
    counts.rentals
      ? t('security.auditLog.counts.rentals', { count: counts.rentals })
      : null,
    counts.payments
      ? t('security.auditLog.counts.payments', { count: counts.payments })
      : null,
    counts.fines
      ? t('security.auditLog.counts.fines', { count: counts.fines })
      : null,
    counts.accidents
      ? t('security.auditLog.counts.accidents', { count: counts.accidents })
      : null,
    counts.bookingRequests
      ? t('security.auditLog.counts.bookingRequests', {
          count: counts.bookingRequests,
        })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

export const auditLogMatchesDateFilter = (
  log: DeletionAuditLog,
  filters: Pick<
    AuditLogFilters,
    'dateFilter' | 'customStartDate' | 'customEndDate'
  >,
): boolean => {
  const deletedAt = dayjs(log.deletedAt);

  if (filters.dateFilter === 'TODAY') {
    return deletedAt.isSame(dayjs(), 'day');
  }

  if (filters.dateFilter === 'LAST_7_DAYS') {
    return deletedAt.isAfter(dayjs().subtract(7, 'day').startOf('day'));
  }

  if (filters.dateFilter === 'LAST_30_DAYS') {
    return deletedAt.isAfter(dayjs().subtract(30, 'day').startOf('day'));
  }

  if (filters.dateFilter === 'CUSTOM') {
    return (
      deletedAt.isAfter(
        dayjs(filters.customStartDate).startOf('day').subtract(1, 'ms'),
      ) &&
      deletedAt.isBefore(dayjs(filters.customEndDate).endOf('day').add(1, 'ms'))
    );
  }

  return true;
};

export const filterAndSortAuditLogs = (
  logs: DeletionAuditLog[],
  filters: AuditLogFilters,
  t: Translate,
): DeletionAuditLog[] => {
  const normalizedSearch = filters.searchQuery.trim().toLowerCase();

  return logs
    .filter(log => {
      if (
        filters.targetFilter !== 'ALL' &&
        log.targetType !== filters.targetFilter
      ) {
        return false;
      }

      if (
        filters.actorFilter !== ALL_AUDIT_LOG_ACTORS &&
        getAuditLogActorLabel(log, t) !== filters.actorFilter
      ) {
        return false;
      }

      if (!auditLogMatchesDateFilter(log, filters)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        log.targetLabel,
        getAuditLogTargetLabel(log.targetType, t),
        log.reason,
        getAuditLogActorLabel(log, t),
        formatAuditLogDeletedCounts(log.deletedCounts, t),
        formatDateTime(log.deletedAt),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    })
    .sort((a, b) => {
      const direction = filters.sortFilter === 'NEWEST' ? -1 : 1;
      return direction * dayjs(a.deletedAt).diff(dayjs(b.deletedAt));
    });
};

export const auditLogHasActiveFilters = (filters: AuditLogFilters): boolean =>
  filters.searchQuery.trim().length > 0 ||
  filters.targetFilter !== 'ALL' ||
  filters.actorFilter !== ALL_AUDIT_LOG_ACTORS ||
  filters.dateFilter !== 'ALL' ||
  filters.sortFilter !== 'NEWEST';
