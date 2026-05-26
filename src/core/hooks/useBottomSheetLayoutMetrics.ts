import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_MAX_SHEET_FRACTION } from '@core/helpers/bottomSheetSnapHeight';
import { getScreenBottomClearance } from '@core/helpers/screenBottomInset';
import { useOptionalBottomTabBarHeight } from './useOptionalBottomTabBarHeight';

/** Snap height and scroll padding for bottom sheets (under the tab bar). */
export const useBottomSheetLayoutMetrics = () => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useOptionalBottomTabBarHeight();

  return useMemo(() => {
    const topInset = insets.top;
    const availableBelowStatusBar = Math.max(0, windowHeight - topInset);
    const maxSnapPoint = Math.round(availableBelowStatusBar * DEFAULT_MAX_SHEET_FRACTION);
    const contentBottomPadding = getScreenBottomClearance(tabBarHeight, insets.bottom);

    return {
      topInset,
      bottomInset: 0,
      maxSnapPoint,
      contentBottomPadding,
    };
  }, [insets.top, insets.bottom, windowHeight, tabBarHeight]);
};
