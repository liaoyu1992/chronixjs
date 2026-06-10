import type { InputProps } from './input-props.js';

export function resolveInputClassList(props: InputProps): string[] {
  const classes = ['cx-ui-input', `cx-ui-input--${props.type}`, `cx-ui-input--${props.size}`];
  if (props.disabled) classes.push('cx-ui-input--disabled');
  if (props.clearable) classes.push('cx-ui-input--clearable');
  if (props.error !== undefined) classes.push('cx-ui-input--invalid');
  return classes;
}
