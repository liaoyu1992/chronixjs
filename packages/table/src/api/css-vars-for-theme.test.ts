import { describe, expect, it } from 'vitest';

import { defaultChronixTableTheme } from './chronix-table-theme.js';
import { cssVarsForTheme } from './css-vars-for-theme.js';

describe('cssVarsForTheme', () => {
  it('default theme produces all 30 expected --cx-table-* keys (adds status-bar-height + status-bar-bg)', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    const keys = Object.keys(vars).sort();
    expect(keys).toEqual(
      [
        '--cx-table-cell-padding-x',
        '--cx-table-default-column-width',
        '--cx-table-default-min-column-width',
        '--cx-table-drag-fill-handle-color',
        '--cx-table-even-row-bg',
        '--cx-table-footer-bg',
        '--cx-table-footer-height',
        '--cx-table-header-bg',
        '--cx-table-header-border-color',
        '--cx-table-header-group-bg',
        '--cx-table-header-group-height',
        '--cx-table-header-height',
        '--cx-table-odd-row-bg',
        '--cx-table-overlay-bg',
        '--cx-table-pinned-row-z-index',
        '--cx-table-pinned-shadow-color',
        '--cx-table-pinned-zone-bg',
        '--cx-table-row-checkbox-indeterminate-color',
        '--cx-table-row-divider-color',
        '--cx-table-row-height',
        '--cx-table-selection-column-width',
        '--cx-table-status-bar-bg',
        '--cx-table-status-bar-height',
        '--cx-table-status-bar-text-color',
        '--cx-table-tooltip-bg',
        '--cx-table-tooltip-color',
        '--cx-table-tooltip-delay-ms',
        '--cx-table-tree-chevron-color',
        '--cx-table-tree-error-color',
        '--cx-table-tree-indent-px',
        '--cx-table-tree-spinner-color',
      ].sort(),
    );
  });

  it('tree-spinner-color + tree-error-color emit as raw color strings', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-tree-spinner-color']).toBe('#5a6675');
    expect(vars['--cx-table-tree-error-color']).toBe('#dc2626');
  });

  it('status-bar tokens emit with px / raw-string conventions', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-status-bar-height']).toBe('36px');
    expect(vars['--cx-table-status-bar-bg']).toBe('#fafbfc');
    expect(vars['--cx-table-status-bar-text-color']).toBe('#3a414a');
  });

  it('pinned-row-z-index emits as raw number string (no px)', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-pinned-row-z-index']).toBe('2');
  });

  it('tooltip tokens emit per type', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-tooltip-delay-ms']).toBe('400');
    expect(vars['--cx-table-tooltip-bg']).toBe('#2a2f36');
    expect(vars['--cx-table-tooltip-color']).toBe('#ffffff');
  });

  it('overlay-bg emits as raw color string', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-overlay-bg']).toBe('rgba(255, 255, 255, 0.85)');
  });

  it('header-group tokens emit with px / raw-string conventions', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-header-group-height']).toBe('28px');
    expect(vars['--cx-table-header-group-bg']).toBe('#e8ecf0');
  });

  it('footer tokens emit with px / raw-string conventions', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-footer-height']).toBe('32px');
    expect(vars['--cx-table-footer-bg']).toBe('#f8f9fa');
  });

  it('tree tokens emit with px / raw-string conventions', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-tree-indent-px']).toBe('16px');
    expect(vars['--cx-table-tree-chevron-color']).toBe('#5a6675');
  });

  it('row-checkbox-indeterminate-color emits as raw color', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-row-checkbox-indeterminate-color']).toBe('#5a6675');
  });

  it('pinned-* tokens emit as raw color/string values', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-pinned-shadow-color']).toBe('rgba(15, 23, 42, 0.12)');
    expect(vars['--cx-table-pinned-zone-bg']).toBe('inherit');
  });

  it('geometry tokens are emitted with px units', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-header-height']).toBe('32px');
    expect(vars['--cx-table-row-height']).toBe('28px');
    expect(vars['--cx-table-cell-padding-x']).toBe('8px');
    expect(vars['--cx-table-default-column-width']).toBe('100px');
    expect(vars['--cx-table-default-min-column-width']).toBe('40px');
    expect(vars['--cx-table-selection-column-width']).toBe('36px');
  });

  it('color tokens are emitted as raw strings (no units)', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    expect(vars['--cx-table-header-bg']).toBe('#f1f3f5');
    expect(vars['--cx-table-header-border-color']).toBe('#d9dde2');
    expect(vars['--cx-table-row-divider-color']).toBe('#eceff2');
    expect(vars['--cx-table-even-row-bg']).toBe('#fafbfc');
    expect(vars['--cx-table-odd-row-bg']).toBe('#ffffff');
  });

  it('consumer overrides propagate to the CSS-var output', () => {
    const customTheme = {
      ...defaultChronixTableTheme,
      headerBg: 'tomato',
      rowHeight: 40,
    };
    const vars = cssVarsForTheme(customTheme);
    expect(vars['--cx-table-header-bg']).toBe('tomato');
    expect(vars['--cx-table-row-height']).toBe('40px');
    // Untouched defaults remain.
    expect(vars['--cx-table-even-row-bg']).toBe('#fafbfc');
  });

  it('returned record has string-only values (safe for style attribute)', () => {
    const vars = cssVarsForTheme(defaultChronixTableTheme);
    for (const [key, value] of Object.entries(vars)) {
      expect(typeof value).toBe('string');
      expect(key.startsWith('--cx-table-')).toBe(true);
    }
  });
});
