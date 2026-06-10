import type { TagProps } from './tag-spec.js';

/**
 * Compute the array of CSS class names the adapter should apply to a
 * Tag's root element. Pure function — same algorithm across vue3 /
 * vue2 / react adapters, so the rendered class set is identical
 * (parity-by-construction).
 *
 * Phase 13 (2026-06-02). Mirrors Phase 11 Button's
 * `resolveButtonClassList` contract.
 *
 * Class structure:
 *
 * - `'cx-ui-tag'` — always present (BEM block).
 * - `'cx-ui-tag--{type}'` — `default` / `primary` / `info` / `success`
 *   / `warning` / `error`. Drives type-specific token reads
 *   (`var(--cx-ui-tag-bg-color-success, ...)`).
 * - `'cx-ui-tag--{size}'` — `small` / `medium` / `large`. Drives
 *   per-size padding + height + font-size token reads.
 * - `'cx-ui-tag--bordered'` — present iff `props.bordered` true.
 * - `'cx-ui-tag--round'` — present iff `props.round` true. Drives
 *   full-pill border-radius.
 * - `'cx-ui-tag--closable'` — present iff `props.closable` true.
 *   Drives padding-right reservation for the close button.
 * - `'cx-ui-tag--disabled'` — present iff `props.disabled` true.
 *
 * The returned array is fresh (consumer may push / shift safely).
 * Order is stable across calls for deterministic snapshot tests.
 */
export function resolveTagClassList(props: TagProps): string[] {
  const classes = ['cx-ui-tag', `cx-ui-tag--${props.type}`, `cx-ui-tag--${props.size}`];
  if (props.bordered) classes.push('cx-ui-tag--bordered');
  if (props.round) classes.push('cx-ui-tag--round');
  if (props.closable) classes.push('cx-ui-tag--closable');
  if (props.disabled) classes.push('cx-ui-tag--disabled');
  return classes;
}
