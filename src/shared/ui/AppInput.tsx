import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, HelperText, Text } from 'react-native-paper';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { colors } from '@app/theme';
import { typography } from '@app/theme/typography';
import { spacing } from '@app/theme/spacing';

interface AppInputProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  placeholder?: string;
  disabled?: boolean;
}

export const AppInput = memo<AppInputProps>(
  ({ label, value, onChangeText, error, multiline, keyboardType, placeholder, disabled }) => (
    <View style={styles.container}>
      <Text style={typography.label}>{label}</Text>
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        disabled={disabled}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        style={multiline ? styles.multiline : undefined}
      />
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  ),
);

interface ControlledAppInputProps<T extends FieldValues> extends Omit<AppInputProps, 'value' | 'onChangeText'> {
  name: Path<T>;
  control: Control<T>;
}

export function ControlledAppInput<T extends FieldValues>({
  name,
  control,
  ...props
}: ControlledAppInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <AppInput
          {...props}
          value={String(value ?? '')}
          onChangeText={onChange}
          error={error?.message}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  multiline: { minHeight: 100 },
});
