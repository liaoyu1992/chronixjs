import type { RadioGroupProps, RadioProps } from './radio-spec.js';

export function resolveRadioClassList(props: RadioProps): string[] {
  const classes = ['cx-ui-radio'];
  if (props.checked) classes.push('cx-ui-radio--checked');
  if (props.disabled) classes.push('cx-ui-radio--disabled');
  return classes;
}

export function resolveRadioGroupClassList(props: RadioGroupProps): string[] {
  const classes = ['cx-ui-radio-group'];
  if (props.disabled) classes.push('cx-ui-radio-group--disabled');
  if (props.error !== undefined) classes.push('cx-ui-radio-group--invalid');
  return classes;
}
