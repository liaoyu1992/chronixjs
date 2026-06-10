import type { AutoCompleteProps } from './autocomplete-spec.js';

export interface ResolveAutoCompleteClassListInput {
  readonly props: AutoCompleteProps;
  readonly open: boolean;
}

export function resolveAutoCompleteClassList(input: ResolveAutoCompleteClassListInput): string[] {
  const { props, open } = input;
  const classes = ['cx-ui-autocomplete', `cx-ui-autocomplete--${props.size}`];
  if (open) classes.push('cx-ui-autocomplete--open');
  if (props.disabled) classes.push('cx-ui-autocomplete--disabled');
  if (props.error !== undefined) classes.push('cx-ui-autocomplete--invalid');
  return classes;
}
