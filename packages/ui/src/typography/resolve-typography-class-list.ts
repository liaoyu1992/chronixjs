import type { TypographyProps } from './typography-spec.js';

export function resolveTypographyClassList(props: TypographyProps): string[] {
  const classes = ['cx-ui-typography', `cx-ui-typography--${props.variant}`];
  if (props.variant === 'title') {
    classes.push(`cx-ui-typography--level-${props.level}`);
  }
  if (props.italic) classes.push('cx-ui-typography--italic');
  if (props.underline) classes.push('cx-ui-typography--underline');
  return classes;
}
