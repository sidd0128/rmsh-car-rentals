import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Minimum shortest-side width (dp) to treat the device as a tablet / iPad. */
const TABLET_SHORTEST_SIDE = 600;

/**
 * Responsive layout flags for phones vs tablets (including iPad).
 */
export const useDeviceLayout = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const shortestSide = Math.min(width, height);
    const isTablet = shortestSide >= TABLET_SHORTEST_SIDE;
    const isLandscape = width > height;
    const contentMaxWidth = isTablet ? 960 : width;
    const listNumColumns = isTablet ? 2 : 1;
    const horizontalPadding = isTablet ? 36 : 20;

    return {
      width,
      height,
      isTablet,
      isLandscape,
      contentMaxWidth,
      listNumColumns,
      horizontalPadding,
    };
  }, [width, height]);
};
