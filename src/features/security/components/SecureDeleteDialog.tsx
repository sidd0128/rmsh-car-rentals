import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
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

const formatCountLine = (label: string, count: number): string | null =>
  count > 0 ? `${label}: ${count}` : null;

export const SecureDeleteDialog = memo<SecureDeleteDialogProps>(
  ({ visible, targetType, targetId, onCancel, onDeleted }) => {
    const { colors } = useThemeContext();
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
              : 'Could not load deletion details.',
          );
        })
        .finally(() => setLoadingSummary(false));
    }, [targetId, targetType, visible]);

    const countLines = useMemo(() => {
      if (!summary) {
        return [];
      }

      return [
        formatCountLine('Cars', summary.counts.cars),
        formatCountLine('Customers', summary.counts.customers),
        formatCountLine('Rentals', summary.counts.rentals),
        formatCountLine('Payments', summary.counts.payments),
        formatCountLine('Fines', summary.counts.fines),
        formatCountLine('Accidents', summary.counts.accidents),
        formatCountLine('Booking requests', summary.counts.bookingRequests),
      ].filter((line): line is string => Boolean(line));
    }, [summary]);

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
            : 'Could not delete this record.',
        );
      } finally {
        setDeleting(false);
      }
    };

    return (
      <AppDialog
        visible={visible}
        title="Confirm secure deletion"
        onDismiss={deleting ? undefined : onCancel}
        actions={
          <>
            <AppButton
              label="Cancel"
              variant="outline"
              onPress={onCancel}
              disabled={deleting}
            />
            <AppButton
              label="Delete"
              variant="danger"
              onPress={handleDelete}
              loading={deleting}
              disabled={!canDelete}
            />
          </>
        }
      >
        <View style={styles.content}>
          <Text style={[typography.body, { color: colors.error }]}>
            {requiresReauthentication
              ? 'This permanently deletes the selected record and linked history from this app and queues the same deletion for Firebase.'
              : 'This record has no linked history. It can be deleted without password confirmation, and the deletion will still be logged.'}
          </Text>
          {summary ? (
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: colors.errorBg,
                  borderColor: colors.error,
                },
              ]}
            >
              <Text style={typography.h4}>{summary.targetLabel}</Text>
              {countLines.map(line => (
                <Text key={line} style={typography.bodySmall}>
                  {line}
                </Text>
              ))}
              {!requiresReauthentication ? (
                <Text style={typography.bodySmall}>
                  No linked history found.
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={typography.bodySmall}>
              {loadingSummary
                ? 'Loading deletion details...'
                : 'No details available.'}
            </Text>
          )}
          {requiresReauthentication ? (
            <>
              <AppInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                enablePasswordToggle
                autoCapitalize="none"
                autoComplete="password"
              />
              <AppInput
                label="Reason"
                value={reason}
                onChangeText={setReason}
                multiline
                placeholder="Explain why this record is being deleted"
              />
            </>
          ) : null}
          {error ? (
            <Text style={[typography.bodySmall, { color: colors.error }]}>
              {error}
            </Text>
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
  summaryBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
