// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_SWITCH_CSS, ensureChronixSwitchStyles } from './switch-styles.js';

describe('CHRONIX_SWITCH_CSS', () => {
  it('declares base + handle + 3 sizes', () => {
    expect(CHRONIX_SWITCH_CSS).toContain('.cx-ui-switch');
    expect(CHRONIX_SWITCH_CSS).toContain('.cx-ui-switch__handle');
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_SWITCH_CSS).toContain(`.cx-ui-switch--${s}`);
    }
  });

  it('declares --checked + --disabled + --invalid modifiers', () => {
    expect(CHRONIX_SWITCH_CSS).toContain('.cx-ui-switch--checked');
    expect(CHRONIX_SWITCH_CSS).toContain('.cx-ui-switch--disabled');
    expect(CHRONIX_SWITCH_CSS).toContain('.cx-ui-switch--invalid');
  });
});

describe('ensureChronixSwitchStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixSwitchStyles();
    ensureChronixSwitchStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="switch"]').length).toBe(1);
  });
});
