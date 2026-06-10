import { describe, expect, it } from 'vitest';

import { CHRONIX_TIME_PICKER_CSS, ensureChronixTimePickerStyles } from './time-picker-styles.js';

describe('CHRONIX_TIME_PICKER_CSS', () => {
  it('contains root class', () => {
    expect(CHRONIX_TIME_PICKER_CSS).toContain('.cx-ui-time-picker');
  });

  it('contains trigger class', () => {
    expect(CHRONIX_TIME_PICKER_CSS).toContain('.cx-ui-time-picker__trigger');
  });

  it('contains panel class', () => {
    expect(CHRONIX_TIME_PICKER_CSS).toContain('.cx-ui-time-picker__panel');
  });

  it('contains item class', () => {
    expect(CHRONIX_TIME_PICKER_CSS).toContain('.cx-ui-time-picker__item');
  });

  it('contains modifier classes', () => {
    expect(CHRONIX_TIME_PICKER_CSS).toContain('--disabled');
    expect(CHRONIX_TIME_PICKER_CSS).toContain('--selected');
  });
});

describe('ensureChronixTimePickerStyles', () => {
  it('does not throw in non-DOM env', () => {
    expect(() => ensureChronixTimePickerStyles()).not.toThrow();
  });
});
