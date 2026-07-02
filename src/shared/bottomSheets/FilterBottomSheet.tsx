import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { calculateFilterSheetSnapHeight } from '@core/helpers/bottomSheetSnapHeight';
import { useBottomSheetLayoutMetrics } from '@core/hooks/useBottomSheetLayoutMetrics';
import {
  AppButton,
  SelectableList,
  type SelectableListOption,
} from '@shared/ui';
import { AppBottomSheet, AppBottomSheetRef } from './AppBottomSheet';
import { spacing } from '@app/theme/spacing';
import { typography } from '@app/theme/typography';

type SingleFilterBottomSheetProps<T extends string> = {
  title: string;
  options: SelectableListOption<T>[];
  selectionMode?: 'single';
  selected: T;
  onSelect: (value: T) => void;
};

type MultipleFilterBottomSheetProps<T extends string> = {
  title: string;
  options: SelectableListOption<T>[];
  selectionMode: 'multiple';
  selected: T[];
  onSelect: (value: T[]) => void;
  applyLabel?: string;
};

type FilterBottomSheetProps<T extends string> =
  | SingleFilterBottomSheetProps<T>
  | MultipleFilterBottomSheetProps<T>;

export interface FilterBottomSheetRef {
  open: () => void;
  close: () => void;
}

function FilterBottomSheetInner<T extends string>(
  props: FilterBottomSheetProps<T>,
  ref: React.Ref<FilterBottomSheetRef>,
) {
  const { title, options } = props;
  const sheetRef = useRef<AppBottomSheetRef>(null);
  const { height: screenHeight } = useWindowDimensions();
  const { topInset } = useBottomSheetLayoutMetrics();

  const snapHeight = useMemo(
    () =>
      calculateFilterSheetSnapHeight({
        optionCount: options.length,
        screenHeight,
        topInset,
      }),
    [options.length, screenHeight, topInset],
  );

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  return (
    <AppBottomSheet ref={sheetRef} snapPoints={[snapHeight]}>
      <Text style={typography.h3}>{title}</Text>
      {props.selectionMode === 'multiple' ? (
        <>
          <SelectableList
            mode="multiple"
            options={options}
            selected={props.selected}
            onChange={props.onSelect}
          />
          <AppButton
            label={props.applyLabel ?? 'Apply'}
            onPress={() => sheetRef.current?.close()}
            fullWidth
            style={styles.applyButton}
          />
        </>
      ) : (
        <SelectableList
          options={options}
          selected={props.selected}
          onChange={value => {
            props.onSelect(value);
            sheetRef.current?.close();
          }}
        />
      )}
    </AppBottomSheet>
  );
}

export const FilterBottomSheet = forwardRef(FilterBottomSheetInner) as <
  T extends string,
>(
  props: FilterBottomSheetProps<T> & { ref?: React.Ref<FilterBottomSheetRef> },
) => React.ReactElement;

const styles = StyleSheet.create({
  applyButton: {
    marginTop: spacing.sm,
  },
});
