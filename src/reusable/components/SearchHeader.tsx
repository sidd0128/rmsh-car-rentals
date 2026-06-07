import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors, spacing } from '@app/theme';
import { SearchBar } from './SearchBar';

export interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

export const SearchHeader = memo<SearchHeaderProps>(
  ({ value, onChangeText, placeholder = 'Search...', onFilterPress }) => (
    <View style={styles.row}>
      <SearchBar
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        style={styles.search}
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
  },
  filterBtn: {
    margin: 0,
    marginLeft: spacing.xs,
  },
});
