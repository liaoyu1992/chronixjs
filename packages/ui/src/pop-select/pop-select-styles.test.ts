// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_POP_SELECT_CSS, ensureChronixPopSelectStyles } from './pop-select-styles.js';

describe('CHRONIX_POP_SELECT_CSS', () => {
  it('declares base + __list + __option + --active + --disabled', () => {
    expect(CHRONIX_POP_SELECT_CSS).toContain('.cx-ui-pop-select');
    expect(CHRONIX_POP_SELECT_CSS).toContain('.cx-ui-pop-select__list');
    expect(CHRONIX_POP_SELECT_CSS).toContain('.cx-ui-pop-select__option');
    expect(CHRONIX_POP_SELECT_CSS).toContain('.cx-ui-pop-select__option--active');
    expect(CHRONIX_POP_SELECT_CSS).toContain('.cx-ui-pop-select__option--disabled');
  });
});

describe('ensureChronixPopSelectStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixPopSelectStyles();
    ensureChronixPopSelectStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="pop-select"]').length).toBe(1);
  });
});
