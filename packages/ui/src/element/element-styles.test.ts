// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_ELEMENT_CSS, ensureChronixElementStyles } from './element-styles.js';

describe('CHRONIX_ELEMENT_CSS', () => {
  it('declares base + --inline rule', () => {
    expect(CHRONIX_ELEMENT_CSS).toContain('.cx-ui-element');
    expect(CHRONIX_ELEMENT_CSS).toContain('.cx-ui-element--inline');
  });
});

describe('ensureChronixElementStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixElementStyles();
    ensureChronixElementStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="element"]').length).toBe(1);
  });
});
