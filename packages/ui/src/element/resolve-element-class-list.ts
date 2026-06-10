import type { ElementProps } from './element-spec.js';

export function resolveElementClassList(props: ElementProps): string[] {
  const classes = ['cx-ui-element'];
  if (props.inline) classes.push('cx-ui-element--inline');
  return classes;
}
