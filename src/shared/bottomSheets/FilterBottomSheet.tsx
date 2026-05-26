import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, RadioButton } from 'react-native-paper';
import { calculateFilterSheetSnapHeight } from '@core/helpers/bottomSheetSnapHeight';
import { useBottomSheetLayoutMetrics } from '@core/hooks/useBottomSheetLayoutMetrics';
import { AppBottomSheet, AppBottomSheetRef } from './AppBottomSheet';
import { spacing } from '@app/theme/spacing';
import { typography } from '@app/theme/typography';

type FilterOption<T extends string> = {
  label: string;
  value: T;
};

interface FilterBottomSheetProps<T extends string> {
  title: string;
  options: FilterOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export interface FilterBottomSheetRef {
  open: () => void;
  close: () => void;
}

function FilterBottomSheetInner<T extends string>(
  { title, options, selected, onSelect }: FilterBottomSheetProps<T>,
  ref: React.Ref<FilterBottomSheetRef>,
) {
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
      <View style={styles.options}>
        <RadioButton.Group
          onValueChange={v => {
            onSelect(v as T);
            sheetRef.current?.close();
          }}
          value={selected}
        >
          {options.map(opt => (
            <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </RadioButton.Group>
      </View>
    </AppBottomSheet>
  );
}

export const FilterBottomSheet = forwardRef(FilterBottomSheetInner) as <T extends string>(
  props: FilterBottomSheetProps<T> & { ref?: React.Ref<FilterBottomSheetRef> },
) => React.ReactElement;

const styles = StyleSheet.create({
  options: { marginTop: spacing.sm },
});
