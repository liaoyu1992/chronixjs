// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_FLOAT_BUTTON_CSS, ensureChronixFloatButtonStyles } from './float-button-styles.js';

describe('CHRONIX_FLOAT_BUTTON_CSS', () => {
  it('declares root + shape + type + icon + description BEM', () => {
    expect(CHRONIX_FLOAT_BUTTON_CSS).toContain('.cx-ui-float-button');
    expect(CHRONIX_FLOAT_BUTTON_CSS).toContain('.cx-ui-float-button--shape-circle');
    expect(CHRONIX_FLOAT_BUTTON_CSS).toContain('.cx-ui-float-button--shape-square');
    expect(CHRONIX_FLOAT_BUTTON_CSS).toContain('.cx-ui-float-button--type-primary');
    expect(CHRONIX_FLOAT_BUTTON_CSS).toContain('.cx-ui-float-button__icon');
    expect(CHRONIX_FLOAT_BUTTON_CSS).toContain('.cx-ui-float-button__description');
  });
});

describe('ensureChronixFloatButtonStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixFloatButtonStyles();
    ensureChronixFloatButtonStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="float-button"]').length).toBe(1);
  });
});
