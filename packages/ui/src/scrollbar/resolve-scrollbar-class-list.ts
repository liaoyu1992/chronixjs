import type { ScrollbarProps } from './scrollbar-spec.js';

export function resolveScrollbarClassList(props: Pick<ScrollbarProps, 'trigger'>): string[] {
  const classes: string[] = ['cx-ui-scrollbar'];

  const trigger = props.trigger ?? 'hover';
  if (trigger === 'hover') {
    classes.push('cx-ui-scrollbar--hover');
  } else if (trigger === 'none') {
    classes.push('cx-ui-scrollbar--none');
  }

  return classes;
}
