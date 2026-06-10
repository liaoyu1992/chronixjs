// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_INPUT_OTP_CSS, ensureChronixInputOtpStyles } from './input-otp-styles.js';

describe('CHRONIX_INPUT_OTP_CSS', () => {
  it('declares base + __cell + --disabled + --invalid', () => {
    expect(CHRONIX_INPUT_OTP_CSS).toContain('.cx-ui-otp');
    expect(CHRONIX_INPUT_OTP_CSS).toContain('.cx-ui-otp__cell');
    expect(CHRONIX_INPUT_OTP_CSS).toContain('.cx-ui-otp--disabled');
    expect(CHRONIX_INPUT_OTP_CSS).toContain('.cx-ui-otp--invalid');
  });
});

describe('ensureChronixInputOtpStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixInputOtpStyles();
    ensureChronixInputOtpStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="input-otp"]').length).toBe(1);
  });
});
