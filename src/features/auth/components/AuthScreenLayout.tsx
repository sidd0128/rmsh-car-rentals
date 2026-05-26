import React, { memo, type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_LOGO } from '@core/constants/assets';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { colors, radius, shadows, spacing, typography } from '@app/theme';

interface AuthScreenLayoutProps {
  /** Card heading (e.g. "Welcome back", "Create account") */
  title: string;
  /** Short description under the card heading */
  subtitle: string;
  children: ReactNode;
  /** Optional banner above the form card (session expired, etc.) */
  banner?: ReactNode;
  /** Show back control above the brand (register screen) */
  showBack?: boolean;
  onBackPress?: () => void;
  /** Content below the card (legal note, etc.) */
  footer?: ReactNode;
}

export const AuthScreenLayout = memo<AuthScreenLayoutProps>(
  ({ title, subtitle, children, banner, showBack, onBackPress, footer }) => {
    const insets = useSafeAreaInsets();
    const { horizontalPadding, contentMaxWidth } = useDeviceLayout();

    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: horizontalPadding,
                paddingBottom: insets.bottom + spacing.xxl,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
              {showBack && onBackPress ? (
                <Pressable
                  onPress={onBackPress}
                  style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Icon name="arrow-left" size={22} color={colors.primary} />
                  <Text style={styles.backLabel}>Back to sign in</Text>
                </Pressable>
              ) : null}

              <View style={[styles.brandSection, showBack && styles.brandSectionCompact]}>
                <Image
                  source={APP_LOGO}
                  style={styles.logoImage}
                  accessibilityLabel="RMSH Rentals logo"
                />
                <Text style={styles.brandTagline}>Car rental management</Text>
              </View>

              {banner}

              <View style={[styles.card, shadows.md]}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
                <View style={styles.formFields}>{children}</View>
              </View>

              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: spacing.lg,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backLabel: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  pressed: { opacity: 0.7 },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandSectionCompact: {
    marginBottom: spacing.xl,
  },
  logoImage: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
  },
  brandTagline: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  formFields: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
