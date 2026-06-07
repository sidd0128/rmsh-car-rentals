import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, RadioButton } from 'react-native-paper';
import { spacing } from '@app/theme';

export type SelectableListOption<T extends string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

type BaseSelectableListProps<T extends string> = {
  options: SelectableListOption<T>[];
  style?: object;
};

type SingleSelectableListProps<T extends string> = BaseSelectableListProps<T> & {
  mode?: 'single';
  selected: T;
  onChange: (value: T) => void;
};

type MultiSelectableListProps<T extends string> = BaseSelectableListProps<T> & {
  mode: 'multiple';
  selected: T[];
  onChange: (value: T[]) => void;
};

export type SelectableListProps<T extends string> =
  | SingleSelectableListProps<T>
  | MultiSelectableListProps<T>;

function SelectableListInner<T extends string>(props: SelectableListProps<T>) {
  const { options, style } = props;

  const toggleMultiValue = useCallback(
    (value: T) => {
      if (props.mode !== 'multiple') {
        return;
      }

      const selectedSet = new Set(props.selected);
      if (selectedSet.has(value)) {
        selectedSet.delete(value);
      } else {
        selectedSet.add(value);
      }
      props.onChange(Array.from(selectedSet));
    },
    [props],
  );

  if (props.mode === 'multiple') {
    return (
      <View style={[styles.options, style]}>
        {options.map(opt => (
          <Checkbox.Item
            key={opt.value}
            label={opt.label}
            status={props.selected.includes(opt.value) ? 'checked' : 'unchecked'}
            disabled={opt.disabled}
            onPress={() => toggleMultiValue(opt.value)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.options, style]}>
      <RadioButton.Group onValueChange={value => props.onChange(value as T)} value={props.selected}>
        {options.map(opt => (
          <RadioButton.Item
            key={opt.value}
            label={opt.label}
            value={opt.value}
            disabled={opt.disabled}
          />
        ))}
      </RadioButton.Group>
    </View>
  );
}

export const SelectableList = memo(SelectableListInner) as <T extends string>(
  props: SelectableListProps<T>,
) => React.ReactElement;

const styles = StyleSheet.create({
  options: { marginTop: spacing.sm },
});
