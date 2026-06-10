import type { HighlightProps } from './highlight-spec.js';

export function resolveHighlightClassList(props: HighlightProps): string[] {
  const classes = ['cx-ui-highlight'];
  if (props.caseSensitive) classes.push('cx-ui-highlight--case-sensitive');
  return classes;
}
