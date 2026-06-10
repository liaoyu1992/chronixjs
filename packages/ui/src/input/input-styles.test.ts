// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_INPUT_CSS, ensureChronixInputStyles } from './input-styles.js';

describe('CHRONIX_INPUT_CSS', () => {
  it('declares base + 2 type modifiers + 3 size modifiers', () => {
    expect(CHRONIX_INPUT_CSS).toContain('.cx-ui-input');
    for (const t of ['text', 'textarea']) {
      expect(CHRONIX_INPUT_CSS).toContain(`.cx-ui-input--${t}`);
    }
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_INPUT_CSS).toContain(`.cx-ui-input--${s}`);
    }
  });

  it('declares --disabled, --invalid, and inner / clear / error BEM elements', () => {
    expect(CHRONIX_INPUT_CSS).toContain('.cx-ui-input--disabled');
    expect(CHRONIX_INPUT_CSS).toContain('.cx-ui-input--invalid');
    expect(CHRONIX_INPUT_CSS).toContain('.cx-ui-input__inner');
    expect(CHRONIX_INPUT_CSS).toContain('.cx-ui-input__clear');
    expect(CHRONIX_INPUT_CSS).toContain('.cx-ui-input__error');
  });
});

describe('ensureChronixInputStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixInputStyles();
    ensureChronixInputStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="input"]').length).toBe(1);
  });
});
