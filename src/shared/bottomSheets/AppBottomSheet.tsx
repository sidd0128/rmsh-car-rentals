import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '@app/theme';
import { spacing } from '@app/theme/spacing';
import { radius } from '@app/theme/radius';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useBottomSheetLayoutMetrics } from '@core/hooks/useBottomSheetLayoutMetrics';
import { useBottomSheetModal } from '@core/hooks/useBottomSheetModal';

export interface AppBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface AppBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  /** Long forms: full height below status bar + scroll with tab-bar clearance. */
  scrollable?: boolean;
}

export const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(
  ({ children, snapPoints: snapPointsProp, onDismiss, scrollable = false }, ref) => {
    const { ref: sheetRef, open, close } = useBottomSheetModal();
    const { horizontalPadding } = useDeviceLayout();
    const { topInset, bottomInset, maxSnapPoint, contentBottomPadding } =
      useBottomSheetLayoutMetrics();

    const snapPoints = useMemo(() => {
      if (snapPointsProp?.length) {
        return snapPointsProp;
      }
      if (scrollable) {
        return [maxSnapPoint];
      }
      return [Math.round(maxSnapPoint * 0.5)];
    }, [snapPointsProp, scrollable, maxSnapPoint]);

    useImperativeHandle(ref, () => ({ open, close }), [open, close]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      [],
    );

    const contentStyle = useMemo(
      () => ({
        paddingHorizontal: horizontalPadding,
        paddingTop: spacing.md,
        paddingBottom: contentBottomPadding,
        gap: spacing.md,
      }),
      [horizontalPadding, contentBottomPadding],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={onDismiss}
        topInset={topInset}
        bottomInset={bottomInset}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
      >
        {scrollable ? (
          <BottomSheetScrollView
            contentContainerStyle={contentStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={contentStyle}>{children}</BottomSheetView>
        )}
      </BottomSheetModal>
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
    marginTop: spacing.sm,
  },
});
