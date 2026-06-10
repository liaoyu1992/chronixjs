// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_CHECKBOX_CSS, ensureChronixCheckboxStyles } from './checkbox-styles.js';

describe('CHRONIX_CHECKBOX_CSS', () => {
  it('declares base + box + icon + label + error BEM elements', () => {
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox');
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox__box');
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox__icon');
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox__label');
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox__error');
  });

  it('declares --checked + --indeterminate + --disabled + --invalid modifiers', () => {
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox--checked');
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox--indeterminate');
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox--disabled');
    expect(CHRONIX_CHECKBOX_CSS).toContain('.cx-ui-checkbox--invalid');
  });
});

describe('ensureChronixCheckboxStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixCheckboxStyles();
    ensureChronixCheckboxStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="checkbox"]').length).toBe(1);
  });
});
