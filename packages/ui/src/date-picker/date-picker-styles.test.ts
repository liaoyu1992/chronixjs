import { describe, expect, it } from 'vitest';

import { CHRONIX_DATE_PICKER_CSS, ensureChronixDatePickerStyles } from './date-picker-styles.js';

describe('CHRONIX_DATE_PICKER_CSS', () => {
  it('contains root class', () => {
    expect(CHRONIX_DATE_PICKER_CSS).toContain('.cx-ui-date-picker');
  });

  it('contains trigger class', () => {
    expect(CHRONIX_DATE_PICKER_CSS).toContain('.cx-ui-date-picker__trigger');
  });

  it('contains panel class', () => {
    expect(CHRONIX_DATE_PICKER_CSS).toContain('.cx-ui-date-picker__panel');
  });

  it('contains day class', () => {
    expect(CHRONIX_DATE_PICKER_CSS).toContain('.cx-ui-date-picker__day');
  });

  it('contains modifier classes', () => {
    expect(CHRONIX_DATE_PICKER_CSS).toContain('--disabled');
    expect(CHRONIX_DATE_PICKER_CSS).toContain('--selected');
    expect(CHRONIX_DATE_PICKER_CSS).toContain('--today');
    expect(CHRONIX_DATE_PICKER_CSS).toContain('--other-month');
  });
});

describe('ensureChronixDatePickerStyles', () => {
  it('does not throw in non-DOM env', () => {
    expect(() => ensureChronixDatePickerStyles()).not.toThrow();
  });
});
