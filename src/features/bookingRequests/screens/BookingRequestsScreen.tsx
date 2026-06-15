import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTimeAmPm } from '@core/helpers/date';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useTranslation } from '@core/i18n';
import { formatCurrency } from '@core/utils/currency';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, EmptyState, StatusBadge } from '@shared/ui';
import { useBookingRequestStore } from '../store/useBookingRequestStore';

export const BookingRequestsScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const { hydrateAll } = useHydrateStores();
  const bookingRequests = useBookingRequestStore(s => s.bookingRequests);
  const loading = useBookingRequestStore(s => s.loading);
  const hydrateRequests = useBookingRequestStore(s => s.hydrate);
  const approveRequest = useBookingRequestStore(s => s.approveRequest);
  const declineRequest = useBookingRequestStore(s => s.declineRequest);

  const pendingRequests = useMemo(
    () =>
      bookingRequests
        .filter(request => request.status === 'PENDING')
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [bookingRequests],
  );

  const refresh = useCallback(async () => {
    await hydrateAll();
    await hydrateRequests();
  }, [hydrateAll, hydrateRequests]);

  const handleApprove = (requestId: string) => {
    Alert.alert(t('bookingRequests.approveTitle'), t('bookingRequests.approveMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bookingRequests.approve'),
        onPress: () => {
          approveRequest(requestId).then(async result => {
            if (!result.success) {
              Alert.alert(t('bookingRequests.actionFailedTitle'), result.error);
              return;
            }
            await refresh();
          });
        },
      },
    ]);
  };

  const handleDecline = (requestId: string) => {
    Alert.alert(t('bookingRequests.declineTitle'), t('bookingRequests.declineMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bookingRequests.decline'),
        style: 'destructive',
        onPress: () => {
          declineRequest(requestId).then(async result => {
            if (!result.success) {
              Alert.alert(t('bookingRequests.actionFailedTitle'), result.error);
              return;
            }
            await refresh();
          });
        },
      },
    ]);
  };

  return (
    <ScreenLayout onRefresh={refresh} refreshing={loading}>
      <Text style={typography.h2}>{t('bookingRequests.title')}</Text>
      <Text style={[styles.lead, { color: colors.textSecondary }]}> 
        {t('bookingRequests.subtitle')}
      </Text>

      {pendingRequests.length === 0 ? (
        <EmptyState title={t('bookingRequests.emptyTitle')} />
      ) : (
        pendingRequests.map(request => (
          <View
            key={request.id}
            style={[
              screenStyles.surfaceCard,
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleBlock}>
                <Text style={typography.h4}>{request.customerName}</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}> 
                  {request.carName} · {request.carNumberPlate}
                </Text>
              </View>
              <StatusBadge label={t('bookingRequests.pending')} variant="pending" />
            </View>

            <Text style={[styles.line, { color: colors.textSecondary }]}> 
              {formatDateTimeAmPm(request.startDate)} - {formatDateTimeAmPm(request.endDate)}
            </Text>
            <Text style={[styles.line, { color: colors.textSecondary }]}> 
              {t('bookingRequests.rateAndTotal', {
                rate: formatCurrency(request.rateAmount),
                total: formatCurrency(request.estimatedTotalAmount),
              })}
            </Text>

            <View style={styles.actions}>
              <View style={styles.actionButton}>
                <AppButton
                  label={t('bookingRequests.decline')}
                  variant="outline"
                  onPress={() => handleDecline(request.id)}
                  disabled={loading}
                  fullWidth
                />
              </View>
              <View style={styles.actionButton}>
                <AppButton
                  label={t('bookingRequests.approve')}
                  onPress={() => handleApprove(request.id)}
                  loading={loading}
                  fullWidth
                />
              </View>
            </View>
          </View>
        ))
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  lead: {
    ...typography.bodySmall,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
  },
  line: {
    ...typography.bodySmall,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
