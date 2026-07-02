import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTime } from '@core/helpers/date';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { EmptyState } from '@shared/ui';
import { useDeletionAuditLogStore } from '../store/useDeletionAuditLogStore';

const formatCounts = (counts: {
  cars: number;
  customers: number;
  rentals: number;
  payments: number;
  fines: number;
  accidents: number;
  bookingRequests: number;
}): string =>
  [
    counts.cars ? `${counts.cars} cars` : null,
    counts.customers ? `${counts.customers} customers` : null,
    counts.rentals ? `${counts.rentals} rentals` : null,
    counts.payments ? `${counts.payments} payments` : null,
    counts.fines ? `${counts.fines} fines` : null,
    counts.accidents ? `${counts.accidents} accidents` : null,
    counts.bookingRequests
      ? `${counts.bookingRequests} booking requests`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

export const DeletionAuditLogsScreen = () => {
  const { colors } = useThemeContext();
  const logs = useDeletionAuditLogStore(s => s.logs);
  const hydrate = useDeletionAuditLogStore(s => s.hydrate);

  useFocusEffect(
    useCallback(() => {
      hydrate().catch(() => undefined);
    }, [hydrate]),
  );

  return (
    <ScreenLayout onRefresh={hydrate}>
      <Text style={typography.h2}>Deletion audit log</Text>
      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
        Review secure deletion records saved for operational and security
        accountability.
      </Text>
      {logs.length === 0 ? (
        <EmptyState
          title="No deletion records"
          description="Secure deletion activity will appear here."
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
                  {log.targetType} · {formatDateTime(log.deletedAt)}
                </Text>
              </View>
              <Text style={[styles.actor, { color: colors.textSecondary }]}>
                {log.deletedByEmail ?? log.deletedByUid ?? 'Unknown user'}
              </Text>
            </View>
            <Text style={typography.bodySmall}>{log.reason}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Removed: {formatCounts(log.deletedCounts)}
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
