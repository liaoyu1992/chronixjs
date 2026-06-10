import type { ButtonGroupProps } from './button-group-spec.js';

export function resolveButtonGroupClassList(props: ButtonGroupProps): string[] {
  const classes = ['cx-ui-button-group'];
  classes.push(props.vertical ? 'cx-ui-button-group--vertical' : 'cx-ui-button-group--horizontal');
  return classes;
}
