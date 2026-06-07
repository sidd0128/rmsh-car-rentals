import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar, type SearchbarProps } from 'react-native-paper';
import { colors, radius, spacing } from '@app/theme';

export interface SearchBarProps
  extends Omit<SearchbarProps, 'value' | 'onChangeText' | 'children'> {
  value: string;
  onChangeText: (text: string) => void;
}

export const SearchBar = memo<SearchBarProps>(
  ({ value, onChangeText, placeholder = 'Search...', style, inputStyle, ...rest }) => (
    <Searchbar
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      style={[styles.search, style]}
      inputStyle={[styles.input, inputStyle]}
      iconColor={colors.textSecondary}
      placeholderTextColor={colors.textMuted}
      {...rest}
    />
  ),
);

const styles = StyleSheet.create({
  search: {
    elevation: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  input: {
    fontSize: 15,
    paddingLeft: spacing.xs,
  },
});
