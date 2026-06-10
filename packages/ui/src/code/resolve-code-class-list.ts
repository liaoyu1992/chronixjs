import type { CodeProps } from './code-spec.js';

export function resolveCodeClassList(props: CodeProps): string[] {
  const classes = ['cx-ui-code'];
  if (props.inline) classes.push('cx-ui-code--inline');
  else classes.push('cx-ui-code--block');
  return classes;
}
