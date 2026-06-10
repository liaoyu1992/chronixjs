import type { ListProps } from './list-spec.js';

/**
 * Compute class set for the List root element.
 *
 * Phase 21 (2026-06-03).
 *
 * Class structure:
 *
 * - `'cx-ui-list'` — always present.
 * - `'cx-ui-list--{size}'` — one of `'small' | 'medium' | 'large'`.
 * - `'cx-ui-list--bordered'` — only when `props.bordered`.
 * - `'cx-ui-list--hoverable'` — only when `props.hoverable`.
 * - `'cx-ui-list--with-divider'` — only when `props.showDivider`
 *   (default `true`, so present in most consumer cases).
 */
export function resolveListClassList(props: ListProps): string[] {
  const classes = ['cx-ui-list', `cx-ui-list--${props.size}`];
  if (props.bordered) classes.push('cx-ui-list--bordered');
  if (props.hoverable) classes.push('cx-ui-list--hoverable');
  if (props.showDivider) classes.push('cx-ui-list--with-divider');
  return classes;
}
