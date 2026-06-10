// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_INPUT_NUMBER_CSS, ensureChronixInputNumberStyles } from './input-number-styles.js';

describe('CHRONIX_INPUT_NUMBER_CSS', () => {
  it('declares base + __input + __decrement + __increment + 3 sizes', () => {
    expect(CHRONIX_INPUT_NUMBER_CSS).toContain('.cx-ui-input-number');
    expect(CHRONIX_INPUT_NUMBER_CSS).toContain('.cx-ui-input-number__input');
    expect(CHRONIX_INPUT_NUMBER_CSS).toContain('.cx-ui-input-number__decrement');
    expect(CHRONIX_INPUT_NUMBER_CSS).toContain('.cx-ui-input-number__increment');
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_INPUT_NUMBER_CSS).toContain(`.cx-ui-input-number--${s}`);
    }
  });

  it('declares --disabled + --invalid modifiers', () => {
    expect(CHRONIX_INPUT_NUMBER_CSS).toContain('.cx-ui-input-number--disabled');
    expect(CHRONIX_INPUT_NUMBER_CSS).toContain('.cx-ui-input-number--invalid');
  });
});

describe('ensureChronixInputNumberStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixInputNumberStyles();
    ensureChronixInputNumberStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="input-number"]').length).toBe(1);
  });
});
