import type { BadgeProps } from './badge-spec.js';

/**
 * Compute class set for the Badge ROOT element (`cx-ui-badge`).
 *
 * Phase 14 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-badge'` — always present.
 * - `'cx-ui-badge--standalone'` — present when the adapter is rendering
 *   the badge with no wrapped child (provided by the adapter as the
 *   second arg; "is there child content?" is a framework-layer
 *   question — Vue slot / React children — not a pure prop).
 *
 * The root carries only the structural-mode modifier. Type / dot /
 * processing / show modifiers live on the `__sup` inner element via
 * `resolveBadgeSupClassList`.
 */
export function resolveBadgeClassList(_props: BadgeProps, standalone: boolean): string[] {
  const classes = ['cx-ui-badge'];
  if (standalone) classes.push('cx-ui-badge--standalone');
  return classes;
}

/**
 * Compute class set for the Badge INDICATOR element
 * (`cx-ui-badge__sup`).
 *
 * Phase 14 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-badge__sup'` — always present.
 * - `'cx-ui-badge__sup--{type}'` — `default` / `success` / `warning`
 *   / `error` / `info`. Drives bg + text color tokens.
 * - `'cx-ui-badge__sup--dot'` — present iff `props.dot` true. Drives
 *   a small filled circle without text.
 * - `'cx-ui-badge__sup--processing'` — present iff `props.processing`
 *   true. Drives the pulse animation.
 * - `'cx-ui-badge__sup--hidden'` — present iff `props.show` false.
 *   Drives `display: none`.
 */
export function resolveBadgeSupClassList(props: BadgeProps): string[] {
  const classes = ['cx-ui-badge__sup', `cx-ui-badge__sup--${props.type}`];
  if (props.dot) classes.push('cx-ui-badge__sup--dot');
  if (props.processing) classes.push('cx-ui-badge__sup--processing');
  if (!props.show) classes.push('cx-ui-badge__sup--hidden');
  return classes;
}
