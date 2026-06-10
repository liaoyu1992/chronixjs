// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_FLOAT_BUTTON_GROUP_CSS,
  ensureChronixFloatButtonGroupStyles,
} from './float-button-group-styles.js';

describe('CHRONIX_FLOAT_BUTTON_GROUP_CSS', () => {
  it('declares root + children + trigger + expanded BEM', () => {
    expect(CHRONIX_FLOAT_BUTTON_GROUP_CSS).toContain('.cx-ui-float-button-group');
    expect(CHRONIX_FLOAT_BUTTON_GROUP_CSS).toContain('.cx-ui-float-button-group__children');
    expect(CHRONIX_FLOAT_BUTTON_GROUP_CSS).toContain('.cx-ui-float-button-group--trigger-click');
    expect(CHRONIX_FLOAT_BUTTON_GROUP_CSS).toContain('.cx-ui-float-button-group--trigger-hover');
    expect(CHRONIX_FLOAT_BUTTON_GROUP_CSS).toContain('.cx-ui-float-button-group--expanded');
  });
});

describe('ensureChronixFloatButtonGroupStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixFloatButtonGroupStyles();
    ensureChronixFloatButtonGroupStyles();
    expect(
      document.head.querySelectorAll('style[data-chronix-ui="float-button-group"]').length,
    ).toBe(1);
  });
});
