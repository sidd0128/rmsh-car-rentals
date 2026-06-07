import React, { memo, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { TextInput, HelperText, Text } from 'react-native-paper';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';

interface AppInputProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  placeholder?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'off' | 'name';
  /** MaterialCommunityIcons name shown on the left of the field */
  leftIcon?: string;
  /** Shows eye toggle when `secureTextEntry` is true */
  enablePasswordToggle?: boolean;
  containerStyle?: ViewStyle;
}

export const AppInput = memo<AppInputProps>(
  ({
    label,
    value,
    onChangeText,
    error,
    multiline,
    keyboardType,
    placeholder,
    disabled,
    secureTextEntry,
    autoCapitalize,
    autoComplete,
    leftIcon,
    enablePasswordToggle,
    containerStyle,
  }) => {
    const { colors } = useThemeContext();
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPasswordField = Boolean(secureTextEntry);
    const hidePassword = isPasswordField && !passwordVisible;

    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={typography.label}>{label}</Text>
        <TextInput
          mode="outlined"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          placeholder={placeholder}
          disabled={disabled}
          secureTextEntry={hidePassword}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          outlineStyle={styles.outline}
          style={[
            styles.input,
            { backgroundColor: colors.surface },
            multiline && styles.multiline,
          ]}
          contentStyle={styles.inputContent}
          left={leftIcon ? <TextInput.Icon icon={leftIcon} color={colors.textMuted} /> : undefined}
          right={
            isPasswordField && enablePasswordToggle ? (
              <TextInput.Icon
                icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setPasswordVisible(v => !v)}
                forceTextInputFocus={false}
              />
            ) : undefined
          }
        />
        {error ? <HelperText type="error" visible={Boolean(error)}>{error}</HelperText> : null}
      </View>
    );
  },
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
  outline: {
    borderRadius: radius.sm,
  },
  input: {},
  inputContent: {
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 100 },
});
