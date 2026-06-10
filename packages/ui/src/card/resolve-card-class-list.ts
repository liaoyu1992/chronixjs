import type { CardProps } from './card-spec.js';

/**
 * Compute class set for the Card root element.
 *
 * Phase 15 (2026-06-02).
 *
 * Takes a `hasFooter` boolean from the adapter because "is there a
 * footer slot/children?" lives at the framework layer (Vue named slot
 * vs React named prop). The class set must match across adapters when
 * adapters resolve "footer present" identically.
 *
 * Class structure:
 *
 * - `'cx-ui-card'` — always present.
 * - `'cx-ui-card--{size}'` — drives padding tokens.
 * - `'cx-ui-card--bordered'` — present iff `props.bordered`.
 * - `'cx-ui-card--hoverable'` — present iff `props.hoverable`.
 * - `'cx-ui-card--embedded'` — present iff `props.embedded`.
 * - `'cx-ui-card--with-title'` — present iff `props.title !== undefined`.
 * - `'cx-ui-card--with-footer'` — present iff `hasFooter` true.
 */
export function resolveCardClassList(props: CardProps, hasFooter: boolean): string[] {
  const classes = ['cx-ui-card', `cx-ui-card--${props.size}`];
  if (props.bordered) classes.push('cx-ui-card--bordered');
  if (props.hoverable) classes.push('cx-ui-card--hoverable');
  if (props.embedded) classes.push('cx-ui-card--embedded');
  if (props.title !== undefined) classes.push('cx-ui-card--with-title');
  if (hasFooter) classes.push('cx-ui-card--with-footer');
  return classes;
}
