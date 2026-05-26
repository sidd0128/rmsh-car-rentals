import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@app/theme';
import i18n from '@core/i18n';
import { radius } from '@app/theme/radius';
import { spacing } from '@app/theme/spacing';

type BadgeVariant =
  | 'available'
  | 'on_rent'
  | 'upcoming'
  | 'pending'
  | 'done'
  | 'not_paid'
  | 'default';

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  available: { bg: colors.successBg, text: colors.success },
  on_rent: { bg: colors.infoBg, text: colors.info },
  upcoming: { bg: colors.warningBg, text: colors.warning },
  pending: { bg: colors.warningBg, text: colors.warning },
  done: { bg: colors.successBg, text: colors.success },
  not_paid: { bg: colors.errorBg, text: colors.error },
  default: { bg: colors.borderLight, text: colors.textSecondary },
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const StatusBadge = memo<StatusBadgeProps>(({ label, variant = 'default' }) => {
  const s = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});

export const carStatusToBadge = (
  status: string,
): { label: string; variant: BadgeVariant } => {
  switch (status) {
    case 'AVAILABLE':
      return { label: i18n.t('cars.status.available'), variant: 'available' };
    case 'ON_RENT':
      return { label: i18n.t('cars.status.onRent'), variant: 'on_rent' };
    case 'UPCOMING_BOOKING':
      return { label: i18n.t('cars.status.upcoming'), variant: 'upcoming' };
    default:
      return { label: status, variant: 'default' };
  }
};
