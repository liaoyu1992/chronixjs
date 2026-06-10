import type { InputOtpProps } from './input-otp-spec.js';

export function resolveInputOtpClassList(props: InputOtpProps): string[] {
  const classes = ['cx-ui-otp'];
  if (props.disabled) classes.push('cx-ui-otp--disabled');
  if (props.error !== undefined) classes.push('cx-ui-otp--invalid');
  return classes;
}
