import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { useTranslation } from '@core/i18n';
import type { DeletionTargetType } from '@core/types/domain';
import { AppButton, AppDialog, AppInput } from '@shared/ui';
import {
  DeletionImpactSummary,
  secureDeletionService,
} from '../services/secureDeletionService';

interface SecureDeleteDialogProps {
  visible: boolean;
  targetType: DeletionTargetType;
  targetId: string;
  onCancel: () => void;
  onDeleted: () => void | Promise<void>;
}

const buildCountRow = (label: string, count: number) =>
  count > 0 ? { label, count } : null;

export const SecureDeleteDialog = memo<SecureDeleteDialogProps>(
  ({ visible, targetType, targetId, onCancel, onDeleted }) => {
    const { colors } = useThemeContext();
    const { t } = useTranslation();
    const [summary, setSummary] = useState<DeletionImpactSummary | null>(null);
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!visible) {
        setPassword('');
        setReason('');
        setSummary(null);
        setError(null);
        return;
      }

      setLoadingSummary(true);
      secureDeletionService
        .getImpactSummary(targetType, targetId)
        .then(setSummary)
        .catch(loadError => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t('security.secureDelete.loadDetailsFailed'),
          );
        })
        .finally(() => setLoadingSummary(false));
    }, [t, targetId, targetType, visible]);

    const countRows = useMemo(() => {
      if (!summary) {
        return [];
      }

      return [
        buildCountRow(
          t('security.secureDelete.counts.cars'),
          summary.counts.cars,
        ),
        buildCountRow(
          t('security.secureDelete.counts.customers'),
          summary.counts.customers,
        ),
        buildCountRow(
          t('security.secureDelete.counts.rentals'),
          summary.counts.rentals,
        ),
        buildCountRow(
          t('security.secureDelete.counts.payments'),
          summary.counts.payments,
        ),
        buildCountRow(
          t('security.secureDelete.counts.fines'),
          summary.counts.fines,
        ),
        buildCountRow(
          t('security.secureDelete.counts.accidents'),
          summary.counts.accidents,
        ),
        buildCountRow(
          t('security.secureDelete.counts.bookingRequests'),
          summary.counts.bookingRequests,
        ),
      ].filter((row): row is { label: string; count: number } => Boolean(row));
    }, [summary, t]);

    const requiresReauthentication = summary?.requiresReauthentication === true;
    const canDelete =
      Boolean(summary) &&
      (!requiresReauthentication ||
        (password.trim().length > 0 && reason.trim().length >= 5)) &&
      !deleting &&
      !loadingSummary;

    const handleDelete = async () => {
      if (!canDelete) {
        return;
      }

      setDeleting(true);
      setError(null);
      try {
        await secureDeletionService.deleteWithAudit({
          targetType,
          targetId,
          password,
          reason,
        });
        await onDeleted();
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : t('security.secureDelete.deleteFailed'),
        );
      } finally {
        setDeleting(false);
      }
    };

    const targetLabel = summary
      ? t(
          summary.targetType === 'CAR'
            ? 'security.secureDelete.target.car'
            : 'security.secureDelete.target.customer',
        )
      : t('security.secureDelete.target.record');

    return (
      <AppDialog
        visible={visible}
        title={t('security.secureDelete.title', { target: targetLabel })}
        onDismiss={deleting ? undefined : onCancel}
        scrollable
        actions={
          <View style={styles.actions}>
            <AppButton
              label={t('common.cancel')}
              variant="outline"
              onPress={onCancel}
              disabled={deleting}
              style={styles.actionButton}
            />
            <AppButton
              label={t('security.secureDelete.deleteAction')}
              variant="danger"
              onPress={handleDelete}
              loading={deleting}
              disabled={!canDelete}
              style={styles.actionButton}
            />
          </View>
        }
      >
        <View style={styles.content}>
          <View
            style={[
              styles.warningPanel,
              {
                backgroundColor: colors.errorBg,
                borderColor: colors.error,
              },
            ]}
          >
            <View
              style={[styles.warningIcon, { backgroundColor: colors.error }]}
            >
              <Icon
                name="shield-alert-outline"
                size={22}
                color={colors.textInverse}
              />
            </View>
            <View style={styles.warningText}>
              <Text style={[typography.h4, { color: colors.error }]}>
                {requiresReauthentication
                  ? t('security.secureDelete.highRiskTitle')
                  : t('security.secureDelete.safeCleanupTitle')}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.text }]}>
                {requiresReauthentication
                  ? t('security.secureDelete.highRiskMessage')
                  : t('security.secureDelete.safeCleanupMessage')}
              </Text>
            </View>
          </View>

          {summary ? (
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {t('security.secureDelete.selectedRecord')}
              </Text>
              <Text style={typography.h4}>{summary.targetLabel}</Text>
              <View style={styles.countGrid}>
                {countRows.map(row => (
                  <View
                    key={row.label}
                    style={[
                      styles.countRow,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.borderLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {row.label}
                    </Text>
                    <Text style={styles.countValue}>{row.count}</Text>
                  </View>
                ))}
              </View>
              {!requiresReauthentication ? (
                <View
                  style={[
                    styles.noHistoryPill,
                    { backgroundColor: colors.successBg },
                  ]}
                >
                  <Icon
                    name="check-circle-outline"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={[typography.caption, { color: colors.success }]}>
                    {t('security.secureDelete.noLinkedHistory')}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text
                style={[typography.bodySmall, { color: colors.textSecondary }]}
              >
                {loadingSummary
                  ? t('security.secureDelete.loadingDetails')
                  : t('security.secureDelete.noDetails')}
              </Text>
            </View>
          )}

          {requiresReauthentication ? (
            <View
              style={[
                styles.formPanel,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text style={typography.h4}>
                {t('security.secureDelete.confirmAuthority')}
              </Text>
              <Text
                style={[typography.bodySmall, { color: colors.textSecondary }]}
              >
                {t('security.secureDelete.confirmAuthorityMessage')}
              </Text>
              <AppInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                enablePasswordToggle
                autoCapitalize="none"
                autoComplete="password"
                containerStyle={styles.formField}
              />
              <AppInput
                label={t('security.secureDelete.reason')}
                value={reason}
                onChangeText={setReason}
                multiline
                placeholder={t('security.secureDelete.reasonPlaceholder')}
                containerStyle={styles.formField}
              />
            </View>
          ) : null}

          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: colors.errorBg,
                  borderColor: colors.error,
                },
              ]}
            >
              <Icon
                name="alert-circle-outline"
                size={18}
                color={colors.error}
              />
              <Text
                style={[
                  typography.bodySmall,
                  styles.errorText,
                  { color: colors.error },
                ]}
              >
                {error}
              </Text>
            </View>
          ) : null}
        </View>
      </AppDialog>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  warningPanel: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  countGrid: {
    gap: spacing.xs,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  countValue: {
    ...typography.body,
    fontWeight: '700',
  },
  noHistoryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  formPanel: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formField: {
    marginBottom: 0,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
