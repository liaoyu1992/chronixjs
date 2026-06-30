import { describe, expect, it } from 'vitest';

import { defaultChronixTheme, type ChronixTheme } from './chronix-theme.js';

// The 50-token surface chronix ships in v0. If this list drifts from
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
  // Bar fill / stroke
  'barBackgroundColor',
  'barBorderColor',
  'barTextColor',
  // Today line
  'todayLineColor',
  'todayLineTooltipBg',
  // Today cell bg
  'todayCellBgColor',
  // Toolbar
  'toolbarBg',
  'toolbarButtonBg',
  'toolbarButtonBgActive',
  'toolbarButtonBorder',
  'toolbarButtonColor',
  'toolbarTitleColor',
  // Bar text
  'barFontSize',
  'barFontWeight',
  // Grid lines
  'gridLineColor',
  'gridLineWeekStartColor',
  'gridLineRowRuleColor',
  // Bar selection + resize handles
  'barSelectedBorderColor',
  'barSelectedBorderWidth',
  'barResizerThickness',
  'barResizerDotSize',
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
      'barSelectedBorderColor',
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
      'barFontSize',
      'barFontWeight',
      'barSelectedBorderWidth',
      'barResizerThickness',
      'barResizerDotSize',
    ];
    for (const key of numberKeys) {
      expect(typeof defaultChronixTheme[key]).toBe('number');
    }
    // Opacity ∈ [0, 1].
    expect(defaultChronixTheme.progressFillOpacity).toBeGreaterThanOrEqual(0);
    expect(defaultChronixTheme.progressFillOpacity).toBeLessThanOrEqual(1);
  });

  it('selection/resizer defaults pin to the original spec', () => {
    // Selection border: rgba(0,0,0,0.3) stroke + 2px width mirror the
    // hard-coded values on `.gantt-event-selection-border`. Resizer
    // thickness 8 px mirrors `edgeResizeZone`; dot size 8 px mirrors
    // `--gantt-event-resizer-dot-total-width`. Drift here would change
    // the default visual feedback for selected bars in a way that's
    // visible to every consumer who relies on the default theme.
    expect(defaultChronixTheme.barSelectedBorderColor).toBe('rgba(0,0,0,0.3)');
    expect(defaultChronixTheme.barSelectedBorderWidth).toBe(2);
    expect(defaultChronixTheme.barResizerThickness).toBe(8);
    expect(defaultChronixTheme.barResizerDotSize).toBe(8);
  });
});
