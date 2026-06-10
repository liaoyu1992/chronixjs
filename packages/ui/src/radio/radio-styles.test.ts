// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_RADIO_CSS, ensureChronixRadioStyles } from './radio-styles.js';

describe('CHRONIX_RADIO_CSS', () => {
  it('declares base radio + radio-group + circle + label', () => {
    expect(CHRONIX_RADIO_CSS).toContain('.cx-ui-radio-group');
    expect(CHRONIX_RADIO_CSS).toContain('.cx-ui-radio');
    expect(CHRONIX_RADIO_CSS).toContain('.cx-ui-radio__circle');
    expect(CHRONIX_RADIO_CSS).toContain('.cx-ui-radio__label');
  });

  it('declares --checked + --disabled + --invalid (group) modifiers', () => {
    expect(CHRONIX_RADIO_CSS).toContain('.cx-ui-radio--checked');
    expect(CHRONIX_RADIO_CSS).toContain('.cx-ui-radio--disabled');
    expect(CHRONIX_RADIO_CSS).toContain('.cx-ui-radio-group--invalid');
  });
});

describe('ensureChronixRadioStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixRadioStyles();
    ensureChronixRadioStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="radio"]').length).toBe(1);
  });
});
