// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_AUTOCOMPLETE_CSS,
  ensureChronixAutoCompleteStyles,
} from './autocomplete-styles.js';

describe('CHRONIX_AUTOCOMPLETE_CSS', () => {
  it('declares base + __input + __list + __option + 3 size modifiers', () => {
    expect(CHRONIX_AUTOCOMPLETE_CSS).toContain('.cx-ui-autocomplete');
    expect(CHRONIX_AUTOCOMPLETE_CSS).toContain('.cx-ui-autocomplete__input');
    expect(CHRONIX_AUTOCOMPLETE_CSS).toContain('.cx-ui-autocomplete__list');
    expect(CHRONIX_AUTOCOMPLETE_CSS).toContain('.cx-ui-autocomplete__option');
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_AUTOCOMPLETE_CSS).toContain(`.cx-ui-autocomplete--${s}`);
    }
  });

  it('declares --disabled + --invalid modifiers', () => {
    expect(CHRONIX_AUTOCOMPLETE_CSS).toContain('.cx-ui-autocomplete--disabled');
    expect(CHRONIX_AUTOCOMPLETE_CSS).toContain('.cx-ui-autocomplete--invalid');
  });
});

describe('ensureChronixAutoCompleteStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixAutoCompleteStyles();
    ensureChronixAutoCompleteStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="autocomplete"]').length).toBe(1);
  });
});
