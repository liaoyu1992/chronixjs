import type { ButtonProps } from './button-spec.js';

/**
 * Compute the array of CSS class names the adapter should apply to a
 * Button's root `<button>` element. Pure function — same algorithm
 * across vue3 / vue2 / react adapters, so the rendered class set is
 * identical (parity-by-construction).
 *
 * Phase 11 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-button'` — always present (BEM block).
 * - `'cx-ui-button--{variant}'` — `default` / `primary`. Drives
 *   variant-specific token reads in CSS (`var(--cx-ui-button-bg-color-primary, ...)`).
 * - `'cx-ui-button--{size}'` — `small` / `medium` / `large`. Drives
 *   per-size padding + height token reads.
 * - `'cx-ui-button--disabled'` — present iff `props.disabled` true.
 *   Drives muted-color + `cursor: not-allowed` rules.
 * - `'cx-ui-button--block'` — present iff `props.block` true. Drives
 *   `display: block; width: 100%` rules.
 *
 * The returned array is fresh (consumer may push / shift safely).
 * Order is stable across calls for deterministic snapshot tests.
 */
export function resolveButtonClassList(props: ButtonProps): string[] {
  const classes = ['cx-ui-button', `cx-ui-button--${props.variant}`, `cx-ui-button--${props.size}`];
  if (props.disabled) classes.push('cx-ui-button--disabled');
  if (props.block) classes.push('cx-ui-button--block');
  return classes;
}
