// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_ICON_WRAPPER_CSS, ensureChronixIconWrapperStyles } from './icon-wrapper-styles.js';

describe('CHRONIX_ICON_WRAPPER_CSS', () => {
  it('declares base + inline-flex', () => {
    expect(CHRONIX_ICON_WRAPPER_CSS).toContain('.cx-ui-icon-wrapper');
    expect(CHRONIX_ICON_WRAPPER_CSS).toContain('inline-flex');
  });
});

describe('ensureChronixIconWrapperStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixIconWrapperStyles();
    ensureChronixIconWrapperStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="icon-wrapper"]').length).toBe(1);
  });
});
