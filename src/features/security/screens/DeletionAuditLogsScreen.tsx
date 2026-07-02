import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTime } from '@core/helpers/date';
import { useTranslation } from '@core/i18n';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { EmptyState } from '@shared/ui';
import { useDeletionAuditLogStore } from '../store/useDeletionAuditLogStore';

type Translate = ReturnType<typeof useTranslation>['t'];

const formatCounts = (
  counts: {
    cars: number;
    customers: number;
    rentals: number;
    payments: number;
    fines: number;
    accidents: number;
    bookingRequests: number;
  },
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

export const DeletionAuditLogsScreen = () => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const logs = useDeletionAuditLogStore(s => s.logs);
  const hydrate = useDeletionAuditLogStore(s => s.hydrate);

  useFocusEffect(
    useCallback(() => {
      hydrate().catch(() => undefined);
    }, [hydrate]),
  );

  return (
    <ScreenLayout onRefresh={hydrate}>
      <Text style={typography.h2}>{t('security.auditLog.title')}</Text>
      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
        {t('security.auditLog.subtitle')}
      </Text>
      {logs.length === 0 ? (
        <EmptyState
          title={t('security.auditLog.emptyTitle')}
          description={t('security.auditLog.emptyDescription')}
        />
      ) : (
        logs.map(log => (
          <View
            key={log.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <View style={styles.titleColumn}>
                <Text style={typography.h4}>{log.targetLabel}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {t(
                    log.targetType === 'CAR'
                      ? 'security.auditLog.target.car'
                      : 'security.auditLog.target.customer',
                  )}{' '}
                  · {formatDateTime(log.deletedAt)}
                </Text>
              </View>
              <Text style={[styles.actor, { color: colors.textSecondary }]}>
                {log.deletedByEmail ??
                  log.deletedByUid ??
                  t('security.auditLog.unknownUser')}
              </Text>
            </View>
            <Text style={typography.bodySmall}>{log.reason}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {t('security.auditLog.removed', {
                counts: formatCounts(log.deletedCounts, t),
              })}
            </Text>
          </View>
        ))
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  actor: {
    ...typography.caption,
    flexShrink: 1,
    textAlign: 'right',
  },
});
