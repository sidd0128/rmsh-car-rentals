import {
  calculateBottomSheetSnapHeight,
  calculateFilterSheetSnapHeight,
} from '../bottomSheetSnapHeight';

describe('bottomSheetSnapHeight', () => {
  it('caps content height at a fraction of the screen below the status bar', () => {
    expect(
      calculateBottomSheetSnapHeight({
        screenHeight: 800,
        topInset: 50,
        contentHeight: 900,
        maxScreenFraction: 0.9,
      }),
    ).toBe(Math.round(750 * 0.9));
  });

  it('sizes filter sheets from option count', () => {
    const height = calculateFilterSheetSnapHeight({
      optionCount: 3,
      screenHeight: 800,
      topInset: 50,
    });
    expect(height).toBeGreaterThan(0);
    expect(height).toBeLessThanOrEqual(Math.round(750 * 0.55));
  });
});
