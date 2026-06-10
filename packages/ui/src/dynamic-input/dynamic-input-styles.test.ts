// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_DYNAMIC_INPUT_CSS,
  ensureChronixDynamicInputStyles,
} from './dynamic-input-styles.js';

describe('CHRONIX_DYNAMIC_INPUT_CSS', () => {
  it('declares base class', () => {
    expect(CHRONIX_DYNAMIC_INPUT_CSS).toContain('.cx-ui-dynamic-input');
  });

  it('declares --disabled modifier', () => {
    expect(CHRONIX_DYNAMIC_INPUT_CSS).toContain('.cx-ui-dynamic-input--disabled');
  });

  it('declares BEM elements for item row, input, and buttons', () => {
    expect(CHRONIX_DYNAMIC_INPUT_CSS).toContain('.cx-ui-dynamic-input__item-row');
    expect(CHRONIX_DYNAMIC_INPUT_CSS).toContain('.cx-ui-dynamic-input__item-input');
    expect(CHRONIX_DYNAMIC_INPUT_CSS).toContain('.cx-ui-dynamic-input__remove-btn');
    expect(CHRONIX_DYNAMIC_INPUT_CSS).toContain('.cx-ui-dynamic-input__add-btn');
  });
});

describe('ensureChronixDynamicInputStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixDynamicInputStyles();
    ensureChronixDynamicInputStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="dynamic-input"]').length).toBe(1);
  });
});
