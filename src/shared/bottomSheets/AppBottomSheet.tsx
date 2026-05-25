import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@app/theme';
import { spacing } from '@app/theme/spacing';
import { radius } from '@app/theme/radius';

export interface AppBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface AppBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  onClose?: () => void;
  contentStyle?: ViewStyle;
}

export const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(
  (
    {
      children,
      snapPoints: snapPointsProp,
      enablePanDownToClose = true,
      onClose,
      contentStyle,
    },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(
      () => snapPointsProp ?? ['40%', '70%', '90%'],
      [snapPointsProp],
    );

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.snapToIndex(0),
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        onClose={onClose}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetView style={[styles.content, contentStyle]}>{children}</BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  handle: {
    backgroundColor: colors.border,
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
