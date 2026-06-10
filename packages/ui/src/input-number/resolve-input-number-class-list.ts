import type { InputNumberProps } from './input-number-spec.js';

export function resolveInputNumberClassList(props: InputNumberProps): string[] {
  const classes = ['cx-ui-input-number', `cx-ui-input-number--${props.size}`];
  if (props.disabled) classes.push('cx-ui-input-number--disabled');
  if (props.error !== undefined) classes.push('cx-ui-input-number--invalid');
  return classes;
}
