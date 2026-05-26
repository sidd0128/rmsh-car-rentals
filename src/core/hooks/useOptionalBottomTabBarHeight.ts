import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useContext } from 'react';

/** Tab bar height when inside a bottom tab screen; `0` elsewhere. */
export const useOptionalBottomTabBarHeight = (): number => {
  const height = useContext(BottomTabBarHeightContext);
  return typeof height === 'number' && height > 0 ? height : 0;
};
