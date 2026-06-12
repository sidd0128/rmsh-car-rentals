import React, { memo, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Menu, Text } from 'react-native-paper';
import { spacing } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { AppButton } from '@shared/ui/AppButton';
import { SearchBar } from './SearchBar';

const DEFAULT_SEARCHABLE_MIN_OPTIONS = 12;

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
  searchableMinOptions?: number;
  searchPlaceholder?: string;
  emptySearchMessage?: string;
  maxMenuHeight?: number;
}

function AppDropdownInner<T extends string>({
  label,
  options,
  onSelect,
  variant = 'outline',
  fullWidth,
  actions = [],
  searchable = false,
  searchableMinOptions = DEFAULT_SEARCHABLE_MIN_OPTIONS,
  searchPlaceholder = 'Search...',
  emptySearchMessage = 'No matching options',
  maxMenuHeight,
}: AppDropdownProps<T>) {
  const { colors } = useThemeContext();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const shouldShowSearch =
    searchable || options.length >= searchableMinOptions;
  const optionListMaxHeight =
    maxMenuHeight ?? Math.min(360, Math.max(180, height * 0.38));

  const closeMenu = () => {
    setVisible(false);
    setSearchQuery('');
  };

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!shouldShowSearch || normalizedQuery.length === 0) {
      return options;
    }

    return options.filter(option => {
      const searchableText = `${option.label} ${option.description ?? ''}`;
      return searchableText.toLowerCase().includes(normalizedQuery);
    });
  }, [options, searchQuery, shouldShowSearch]);

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
      {shouldShowSearch ? (
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

      <ScrollView
        style={[styles.optionsList, { maxHeight: optionListMaxHeight }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {filteredOptions.map(option => (
          <Menu.Item
            key={option.value}
            disabled={option.disabled}
            title={
              option.description ? (
                <View>
                  <Text>{option.label}</Text>
                  <Text
                    style={[
                      styles.description,
                      { color: colors.textSecondary },
                    ]}
                  >
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

        {shouldShowSearch && filteredOptions.length === 0 ? (
          <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
            {emptySearchMessage}
          </Text>
        ) : null}
      </ScrollView>

      {actions.length > 0 ? (
        <View
          style={[styles.actionsContainer, { borderTopColor: colors.border }]}
        >
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
        </View>
      ) : null}
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
  optionsList: {
    minWidth: 280,
  },
  description: {
    marginTop: spacing.xxs,
  },
  emptyMessage: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
