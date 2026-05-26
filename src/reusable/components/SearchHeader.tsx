import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar, IconButton } from 'react-native-paper';
import { colors, radius, spacing } from '@app/theme';

export interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

export const SearchHeader = memo<SearchHeaderProps>(
  ({ value, onChangeText, placeholder = 'Search...', onFilterPress }) => (
    <View style={styles.row}>
      <Searchbar
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        style={styles.search}
        inputStyle={styles.input}
        iconColor={colors.textSecondary}
        placeholderTextColor={colors.textMuted}
      />
      {onFilterPress ? (
        <IconButton
          icon="filter-variant"
          onPress={onFilterPress}
          iconColor={colors.primary}
          style={styles.filterBtn}
        />
      ) : null}
    </View>
  ),
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  search: {
    flex: 1,
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
  filterBtn: {
    margin: 0,
    marginLeft: spacing.xs,
  },
});
