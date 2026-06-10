import type { CheckboxProps } from './checkbox-spec.js';

export function resolveCheckboxClassList(props: CheckboxProps): string[] {
  const classes = ['cx-ui-checkbox'];
  if (props.checked) classes.push('cx-ui-checkbox--checked');
  if (props.indeterminate) classes.push('cx-ui-checkbox--indeterminate');
  if (props.disabled) classes.push('cx-ui-checkbox--disabled');
  if (props.error !== undefined) classes.push('cx-ui-checkbox--invalid');
  return classes;
}
