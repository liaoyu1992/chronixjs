// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_TOOLTIP_CSS, ensureChronixTooltipStyles } from './tooltip-styles.js';

describe('CHRONIX_TOOLTIP_CSS', () => {
  it('declares base + --open + position: fixed', () => {
    expect(CHRONIX_TOOLTIP_CSS).toContain('.cx-ui-tooltip');
    expect(CHRONIX_TOOLTIP_CSS).toContain('.cx-ui-tooltip--open');
    expect(CHRONIX_TOOLTIP_CSS).toMatch(/position:\s*fixed/);
  });
});

describe('ensureChronixTooltipStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixTooltipStyles();
    ensureChronixTooltipStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="tooltip"]').length).toBe(1);
  });
});
