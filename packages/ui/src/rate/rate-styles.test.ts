// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_RATE_CSS, ensureChronixRateStyles } from './rate-styles.js';

describe('CHRONIX_RATE_CSS', () => {
  it('declares base + __star + --full + --half + --empty states', () => {
    expect(CHRONIX_RATE_CSS).toContain('.cx-ui-rate');
    expect(CHRONIX_RATE_CSS).toContain('.cx-ui-rate__star');
    expect(CHRONIX_RATE_CSS).toContain('.cx-ui-rate__star--full');
    expect(CHRONIX_RATE_CSS).toContain('.cx-ui-rate__star--half');
  });

  it('declares --disabled + --readonly + --invalid modifiers', () => {
    expect(CHRONIX_RATE_CSS).toContain('.cx-ui-rate--disabled');
    expect(CHRONIX_RATE_CSS).toContain('.cx-ui-rate--readonly');
    expect(CHRONIX_RATE_CSS).toContain('.cx-ui-rate--invalid');
  });
});

describe('ensureChronixRateStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixRateStyles();
    ensureChronixRateStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="rate"]').length).toBe(1);
  });
});
