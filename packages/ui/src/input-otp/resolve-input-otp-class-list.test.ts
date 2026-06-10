import { describe, expect, it } from 'vitest';

import { defaultInputOtpProps, type InputOtpProps } from './input-otp-spec.js';
import { resolveInputOtpClassList } from './resolve-input-otp-class-list.js';

function props(over: Partial<InputOtpProps> = {}): InputOtpProps {
  return { ...defaultInputOtpProps, ...over };
}

describe('resolveInputOtpClassList', () => {
  it('returns base only for defaults', () => {
    expect(resolveInputOtpClassList(props())).toEqual(['cx-ui-otp']);
  });

  it('emits --disabled when disabled', () => {
    expect(resolveInputOtpClassList(props({ disabled: true }))).toContain('cx-ui-otp--disabled');
  });

  it('emits --invalid when error is defined', () => {
    expect(resolveInputOtpClassList(props({ error: 'bad' }))).toContain('cx-ui-otp--invalid');
  });
});
