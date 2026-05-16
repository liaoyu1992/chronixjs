import { describe, expect, it } from 'vitest';

import { defaultChronixTheme, type ChronixTheme } from './chronix-theme.js';

// The 44-token surface chronix ships in v0. If this list drifts from
// `ChronixTheme` the type-error in `expectedKeys: (keyof ChronixTheme)[]`
// catches it at compile time; the runtime assertion below catches a
// missing default-value mapping.
const EXPECTED_TOKEN_KEYS: readonly (keyof ChronixTheme)[] = [
  // Chart
  'chartBackground',
  // Header band
  'headerBackground',
  'headerCellFill',
  'headerCellStroke',
  'headerCellLabel',
  'headerTickStroke',
  'headerTickLabel',
  'headerDivider',
  // Progress overlay
  'progressFill',
  'progressFillOpacity',
  'progressHandleFill',
  'progressHandleStroke',
  'progressHandleStrokeWidth',
  'progressLabel',
  // Sidebar
  'sidebarBackground',
  'sidebarHeaderCellLabel',
  'sidebarHeaderCellBorder',
  'sidebarHeaderDivider',
  'sidebarBodyCellLabel',
  'sidebarBodyCellBorder',
  // Links
  'linkDefaultColor',
  'linkStrokeWidth',
  // Typography
  'tickLabelFontSize',
  'headerCellLabelFontSize',
  'sidebarHeaderFontSize',
  'sidebarHeaderFontWeight',
  'sidebarBodyFontSize',
  'progressLabelFontSize',
  'progressLabelFontWeight',
  // Bar fill / stroke (Phase 20)
  'barBackgroundColor',
  'barBorderColor',
  'barTextColor',
  // Today line (Phase 21)
  'todayLineColor',
  'todayLineTooltipBg',
  // Today cell bg (Phase 22.2)
  'todayCellBgColor',
  // Toolbar (Phase 22)
  'toolbarBg',
  'toolbarButtonBg',
  'toolbarButtonBgActive',
  'toolbarButtonBorder',
  'toolbarButtonColor',
  'toolbarTitleColor',
  // Grid lines (Phase 26)
  'gridLineColor',
  'gridLineWeekStartColor',
  'gridLineRowRuleColor',
];

describe('defaultChronixTheme', () => {
  it('has every ChronixTheme key defined with a non-empty value', () => {
    const themeKeys = Object.keys(defaultChronixTheme) as (keyof ChronixTheme)[];
    expect(themeKeys.sort()).toEqual([...EXPECTED_TOKEN_KEYS].sort());
    for (const key of themeKeys) {
      const value = defaultChronixTheme[key];
      if (typeof value === 'string') expect(value.length).toBeGreaterThan(0);
      if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('uses the correct primitive types per token (colors are strings, sizes/weights/opacities are numbers)', () => {
    const stringKeys: readonly (keyof ChronixTheme)[] = [
      'chartBackground',
      'headerBackground',
      'headerCellFill',
      'headerCellStroke',
      'headerCellLabel',
      'headerTickStroke',
      'headerTickLabel',
      'headerDivider',
      'progressFill',
      'progressHandleFill',
      'progressHandleStroke',
      'progressLabel',
      'sidebarBackground',
      'sidebarHeaderCellLabel',
      'sidebarHeaderCellBorder',
      'sidebarHeaderDivider',
      'sidebarBodyCellLabel',
      'sidebarBodyCellBorder',
      'linkDefaultColor',
      'barBackgroundColor',
      'barBorderColor',
      'barTextColor',
      'todayLineColor',
      'todayLineTooltipBg',
      'todayCellBgColor',
      'toolbarBg',
      'toolbarButtonBg',
      'toolbarButtonBgActive',
      'toolbarButtonBorder',
      'toolbarButtonColor',
      'toolbarTitleColor',
      'gridLineColor',
      'gridLineWeekStartColor',
      'gridLineRowRuleColor',
    ];
    for (const key of stringKeys) {
      expect(typeof defaultChronixTheme[key]).toBe('string');
    }
    const numberKeys: readonly (keyof ChronixTheme)[] = [
      'progressFillOpacity',
      'progressHandleStrokeWidth',
      'linkStrokeWidth',
      'tickLabelFontSize',
      'headerCellLabelFontSize',
      'sidebarHeaderFontSize',
      'sidebarHeaderFontWeight',
      'sidebarBodyFontSize',
      'progressLabelFontSize',
      'progressLabelFontWeight',
    ];
    for (const key of numberKeys) {
      expect(typeof defaultChronixTheme[key]).toBe('number');
    }
    // Opacity ∈ [0, 1].
    expect(defaultChronixTheme.progressFillOpacity).toBeGreaterThanOrEqual(0);
    expect(defaultChronixTheme.progressFillOpacity).toBeLessThanOrEqual(1);
  });
});
