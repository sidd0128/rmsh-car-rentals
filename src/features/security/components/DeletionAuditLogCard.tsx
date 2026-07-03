import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTime } from '@core/helpers/date';
import { useTranslation } from '@core/i18n';
import type { DeletionAuditLog } from '@core/types/domain';
import {
  formatAuditLogDeletedCounts,
  getAuditLogActorLabel,
  getAuditLogTargetLabel,
} from '../helpers/deletionAuditLogFilters';

interface DeletionAuditLogCardProps {
  log: DeletionAuditLog;
}

export const DeletionAuditLogCard = memo<DeletionAuditLogCardProps>(
  ({ log }) => {
    const { colors } = useThemeContext();
    const { t } = useTranslation();

    return (
      <View
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
              {getAuditLogTargetLabel(log.targetType, t)} ·{' '}
              {formatDateTime(log.deletedAt)}
            </Text>
          </View>
          <Text style={[styles.actor, { color: colors.textSecondary }]}>
            {getAuditLogActorLabel(log, t)}
          </Text>
        </View>
        <Text style={typography.bodySmall}>{log.reason}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {t('security.auditLog.removed', {
            counts: formatAuditLogDeletedCounts(log.deletedCounts, t),
          })}
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
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
