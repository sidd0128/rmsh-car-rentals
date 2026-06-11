import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, Text } from 'react-native-paper';
import { spacing } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { AppButton } from '@shared/ui/AppButton';
import { SearchBar } from './SearchBar';

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
  searchable?: boolean;
  searchPlaceholder?: string;
  emptySearchMessage?: string;
}

function AppDropdownInner<T extends string>({
  label,
  options,
  onSelect,
  variant = 'outline',
  fullWidth,
  actions = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  emptySearchMessage = 'No matching options',
}: AppDropdownProps<T>) {
  const { colors } = useThemeContext();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeMenu = () => {
    setVisible(false);
    setSearchQuery('');
  };

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!searchable || normalizedQuery.length === 0) {
      return options;
    }

    return options.filter(option => {
      const searchableText = `${option.label} ${option.description ?? ''}`;
      return searchableText.toLowerCase().includes(normalizedQuery);
    });
  }, [options, searchQuery, searchable]);

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <AppButton
          label={label}
          variant={variant}
          onPress={() => setVisible(true)}
          fullWidth={fullWidth}
        />
      }
    >
      {searchable ? (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
            style={styles.search}
            inputStyle={styles.searchInput}
          />
        </View>
      ) : null}

      {filteredOptions.map(option => (
        <Menu.Item
          key={option.value}
          disabled={option.disabled}
          title={
            option.description ? (
              <View>
                <Text>{option.label}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
            ) : (
              option.label
            )
          }
          onPress={() => {
            onSelect(option.value);
            closeMenu();
          }}
        />
      ))}

      {searchable && filteredOptions.length === 0 ? (
        <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
          {emptySearchMessage}
        </Text>
      ) : null}

      {actions.map(action => (
        <Menu.Item
          key={action.label}
          title={action.label}
          onPress={() => {
            closeMenu();
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
  searchContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  search: {
    minWidth: 260,
  },
  searchInput: {
    minHeight: 36,
  },
  description: {
    marginTop: spacing.xxs,
  },
  emptyMessage: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
