import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, Text } from 'react-native-paper';
import { colors, spacing } from '@app/theme';
import { AppButton } from '@shared/ui/AppButton';

export type DropdownOption<T extends string> = {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
};

export type DropdownAction = {
  label: string;
  onPress: () => void;
};

export interface AppDropdownProps<T extends string> {
  label: string;
  options: DropdownOption<T>[];
  onSelect: (value: T) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
  actions?: DropdownAction[];
}

function AppDropdownInner<T extends string>({
  label,
  options,
  onSelect,
  variant = 'outline',
  fullWidth,
  actions = [],
}: AppDropdownProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <AppButton
          label={label}
          variant={variant}
          onPress={() => setVisible(true)}
          fullWidth={fullWidth}
        />
      }
    >
      {options.map(option => (
        <Menu.Item
          key={option.value}
          disabled={option.disabled}
          title={
            option.description ? (
              <View>
                <Text>{option.label}</Text>
                <Text style={styles.description}>{option.description}</Text>
              </View>
            ) : (
              option.label
            )
          }
          onPress={() => {
            onSelect(option.value);
            setVisible(false);
          }}
        />
      ))}
      {actions.map(action => (
        <Menu.Item
          key={action.label}
          title={action.label}
          onPress={() => {
            setVisible(false);
            action.onPress();
          }}
        />
      ))}
    </Menu>
  );
}

export const AppDropdown = memo(AppDropdownInner) as <T extends string>(
  props: AppDropdownProps<T>,
) => React.ReactElement;

const styles = StyleSheet.create({
  description: {
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
