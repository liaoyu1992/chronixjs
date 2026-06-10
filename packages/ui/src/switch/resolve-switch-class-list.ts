import type { SwitchProps } from './switch-spec.js';

export function resolveSwitchClassList(props: SwitchProps): string[] {
  const classes = ['cx-ui-switch', `cx-ui-switch--${props.size}`];
  if (props.checked) classes.push('cx-ui-switch--checked');
  if (props.disabled) classes.push('cx-ui-switch--disabled');
  if (props.error !== undefined) classes.push('cx-ui-switch--invalid');
  return classes;
}
