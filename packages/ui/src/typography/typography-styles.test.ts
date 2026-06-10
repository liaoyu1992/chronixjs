// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_TYPOGRAPHY_CSS, ensureChronixTypographyStyles } from './typography-styles.js';

describe('CHRONIX_TYPOGRAPHY_CSS', () => {
  it('declares base + 5 variant modifiers + 6 level modifiers', () => {
    expect(CHRONIX_TYPOGRAPHY_CSS).toContain('.cx-ui-typography');
    for (const v of ['text', 'title', 'p', 'blockquote', 'hr']) {
      expect(CHRONIX_TYPOGRAPHY_CSS).toContain(`.cx-ui-typography--${v}`);
    }
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(CHRONIX_TYPOGRAPHY_CSS).toContain(`.cx-ui-typography--level-${n}`);
    }
  });

  it('declares --italic and --underline rules', () => {
    expect(CHRONIX_TYPOGRAPHY_CSS).toContain('.cx-ui-typography--italic');
    expect(CHRONIX_TYPOGRAPHY_CSS).toContain('.cx-ui-typography--underline');
  });
});

describe('ensureChronixTypographyStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixTypographyStyles();
    ensureChronixTypographyStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="typography"]').length).toBe(1);
  });
});
