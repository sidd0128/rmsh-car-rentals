import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar, IconButton } from 'react-native-paper';
import { colors } from '@app/theme';
import { spacing } from '@app/theme/spacing';

interface SearchHeaderProps {
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
      />
      {onFilterPress ? (
        <IconButton icon="filter-variant" onPress={onFilterPress} iconColor={colors.primary} />
      ) : null}
    </View>
  ),
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  search: { flex: 1, elevation: 0, backgroundColor: colors.surface },
  input: { fontSize: 14 },
});
