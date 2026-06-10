// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_BACK_TOP_CSS, ensureChronixBackTopStyles } from './back-top-styles.js';

describe('CHRONIX_BACK_TOP_CSS', () => {
  it('declares root + icon BEM elements', () => {
    expect(CHRONIX_BACK_TOP_CSS).toContain('.cx-ui-back-top');
    expect(CHRONIX_BACK_TOP_CSS).toContain('.cx-ui-back-top__icon');
  });
  it('positions root as fixed for floating layout', () => {
    expect(CHRONIX_BACK_TOP_CSS).toMatch(/position:\s*fixed/);
  });
});

describe('ensureChronixBackTopStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixBackTopStyles();
    ensureChronixBackTopStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="back-top"]').length).toBe(1);
  });
});
