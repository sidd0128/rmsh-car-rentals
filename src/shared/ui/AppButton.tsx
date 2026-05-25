import React, { memo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button, ButtonProps } from 'react-native-paper';
import { colors } from '@app/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';

interface AppButtonProps extends Omit<ButtonProps, 'children'> {
  label: string;
  variant?: Variant;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const AppButton = memo<AppButtonProps>(
  ({ label, variant = 'primary', fullWidth, style, ...rest }) => {
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
        style={[fullWidth && styles.fullWidth, style]}
        {...rest}
      >
        {label}
      </Button>
    );
  },
);

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
});
