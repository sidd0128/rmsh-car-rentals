const DEFAULT_MAX_SHEET_FRACTION = 0.9;

export { DEFAULT_MAX_SHEET_FRACTION };

type CalculateSnapHeightParams = {
  screenHeight: number;
  topInset?: number;
  contentHeight: number;
  maxScreenFraction?: number;
};

/** Content-sized snap height, capped below the status bar. */
export const calculateBottomSheetSnapHeight = ({
  screenHeight,
  topInset = 0,
  contentHeight,
  maxScreenFraction = DEFAULT_MAX_SHEET_FRACTION,
}: CalculateSnapHeightParams): number => {
  const available = Math.max(0, screenHeight - topInset);
  const maxHeight = available * maxScreenFraction;
  return Math.round(Math.min(contentHeight, maxHeight));
};

type FilterSheetHeightParams = {
  optionCount: number;
  screenHeight: number;
  topInset?: number;
  hasTitle?: boolean;
};

const FILTER_OPTION_HEIGHT = 52;
const FILTER_TITLE_HEIGHT = 44;
const FILTER_VERTICAL_PADDING = 48;

export const calculateFilterSheetSnapHeight = ({
  optionCount,
  screenHeight,
  topInset = 0,
  hasTitle = true,
}: FilterSheetHeightParams): number => {
  const contentHeight =
    optionCount * FILTER_OPTION_HEIGHT +
    (hasTitle ? FILTER_TITLE_HEIGHT : 0) +
    FILTER_VERTICAL_PADDING;

  return calculateBottomSheetSnapHeight({
    screenHeight,
    topInset,
    contentHeight,
    maxScreenFraction: 0.55,
  });
};
