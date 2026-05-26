import { spacing } from '@app/theme/spacing';

/** Extra scroll padding below tab bar (matches `ScreenLayout` scroll screens). */
const SCREEN_BOTTOM_CLEARANCE_EXTRA = spacing.xxl;

/** Space to keep when scrolling above the bottom tab bar and home indicator. */
export const getScreenBottomClearance = (
  tabBarHeight: number,
  safeAreaBottom: number,
): number => tabBarHeight + safeAreaBottom + SCREEN_BOTTOM_CLEARANCE_EXTRA;
