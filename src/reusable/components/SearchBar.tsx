import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar, type SearchbarProps } from 'react-native-paper';
import { radius, spacing } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';

export interface SearchBarProps
  extends Omit<SearchbarProps, 'value' | 'onChangeText' | 'children'> {
  value: string;
  onChangeText: (text: string) => void;
}

export const SearchBar = memo<SearchBarProps>(
  ({ value, onChangeText, placeholder = 'Search...', style, inputStyle, ...rest }) => {
    const { colors } = useThemeContext();

    return (
      <Searchbar
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        style={[
          styles.search,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
          style,
        ]}
        inputStyle={[styles.input, inputStyle]}
        iconColor={colors.textSecondary}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
    );
  },
);

const styles = StyleSheet.create({
  search: {
    elevation: 0,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  input: {
    fontSize: 15,
    paddingLeft: spacing.xs,
  },
});
