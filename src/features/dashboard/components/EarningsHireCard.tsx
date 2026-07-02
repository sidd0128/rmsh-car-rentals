import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  radius,
  shadows,
  spacing,
  typography,
  type AppColors,
} from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { useTranslation } from '@core/i18n';
import type { PaymentStatus } from '@core/types/domain';
import { formatCurrency } from '@core/utils/currency';
import { StatusBadge } from '@shared/ui';

export interface EarningsHireCardProps {
  customerName: string;
  customerInitials: string;
  periodLabel: string;
  agreedPrice: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
}

export const EarningsHireCard = memo<EarningsHireCardProps>(
  ({
    customerName,
    customerInitials,
    periodLabel,
    agreedPrice,
    paidAmount,
    paymentStatus,
  }) => {
    const { t } = useTranslation();
    const { colors } = useThemeContext();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const isPaid = paymentStatus === 'DONE' && paidAmount > 0;

    return (
      <View
        style={[
          styles.card,
          shadows.sm,
          isPaid ? styles.cardPaid : styles.cardPending,
        ]}
      >
        <View
          style={[
            styles.accent,
            isPaid ? styles.accentPaid : styles.accentPending,
          ]}
        />

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.avatar,
                isPaid ? styles.avatarPaid : styles.avatarPending,
              ]}
            >
              <Text style={styles.avatarText}>{customerInitials}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.period}>{periodLabel}</Text>
            </View>
            <StatusBadge
              label={isPaid ? t('common.paid') : t('common.pending')}
              variant={isPaid ? 'done' : 'pending'}
            />
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>{t('earnings.agreed')}</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(agreedPrice)}
              </Text>
            </View>
            <View style={[styles.metricBox, styles.metricBoxHighlight]}>
              <Text style={styles.metricLabel}>
                {t('earnings.receivedMetric')}
              </Text>
              <Text
                style={[
                  styles.metricValue,
                  isPaid ? styles.metricValuePaid : styles.metricValuePending,
                ]}
              >
                {formatCurrency(paidAmount)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.sm,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    cardPaid: {
      borderColor: colors.success,
      backgroundColor: colors.successBg,
    },
    cardPending: {
      borderColor: colors.warning,
      backgroundColor: colors.warningBg,
    },
    accent: {
      width: 4,
    },
    accentPaid: {
      backgroundColor: colors.success,
    },
    accentPending: {
      backgroundColor: colors.warning,
    },
    body: {
      flex: 1,
      padding: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPaid: {
      backgroundColor: colors.successBg,
    },
    avatarPending: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    avatarText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    headerText: {
      flex: 1,
      paddingRight: spacing.xs,
    },
    customerName: {
      ...typography.h4,
      color: colors.text,
    },
    period: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    metricBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    metricBoxHighlight: {
      borderColor: colors.primaryLight,
      backgroundColor: colors.infoBg,
    },
    metricLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.xxs,
    },
    metricValue: {
      ...typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    metricValuePaid: {
      color: colors.success,
    },
    metricValuePending: {
      color: colors.warning,
    },
  });
