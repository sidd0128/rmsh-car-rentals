import React, { memo, useCallback, useState } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Button, ButtonProps } from 'react-native-paper';
import { buttonContentStyle, buttonLabelStyle } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';

interface AppButtonProps extends Omit<ButtonProps, 'children' | 'onPress' | 'loading'> {
  label: string;
  variant?: Variant;
  fullWidth?: boolean;
  style?: ViewStyle;
  /** Parent-controlled loading (e.g. store-driven sync). Combined with internal async press state. */
  loading?: boolean;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  /** Called when this button enters/leaves its own async press busy state (for disabling sibling controls). */
  onBusyChange?: (busy: boolean) => void;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

export const AppButton = memo<AppButtonProps>(
  ({
    label,
    variant = 'primary',
    fullWidth,
    style,
    onPress,
    loading = false,
    disabled,
    onBusyChange,
    ...rest
  }) => {
    const { colors } = useThemeContext();
    const [pressBusy, setPressBusy] = useState(false);
    const isBusy = loading || pressBusy;
    const isDisabled = Boolean(disabled) || isBusy;

    const handlePress = useCallback(
      (event: GestureResponderEvent) => {
        if (isDisabled || !onPress) {
          return;
        }

        const result = onPress(event);
        if (!isPromiseLike(result)) {
          return;
        }

        setPressBusy(true);
        onBusyChange?.(true);

        Promise.resolve(result).finally(() => {
          setPressBusy(false);
          onBusyChange?.(false);
        }).catch(() => undefined);
      },
      [isDisabled, onPress, onBusyChange],
    );

    const mode = variant === 'outline' ? 'outlined' : 'contained';
    const buttonColor =
      variant === 'danger'
        ? colors.error
        : variant === 'secondary'
          ? colors.secondary
          : colors.primary;

    return (
      <Button
        mode={mode}
        buttonColor={variant === 'outline' ? undefined : buttonColor}
        textColor={variant === 'outline' ? colors.primary : colors.textInverse}
        style={[styles.button, fullWidth && styles.fullWidth, style]}
        contentStyle={buttonContentStyle}
        labelStyle={buttonLabelStyle}
        uppercase={false}
        onPress={handlePress}
        disabled={isDisabled}
        loading={isBusy}
        {...rest}
      >
        {label}
      </Button>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
  },
  fullWidth: { width: '100%' },
});
