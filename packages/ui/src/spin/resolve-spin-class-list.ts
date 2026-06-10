import type { SpinProps } from './spin-spec.js';

/**
 * Compute class set for the Spin root element.
 *
 * Phase 16 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-spin'` — always present.
 * - `'cx-ui-spin--{size}'` — `small` / `medium` / `large`.
 * - `'cx-ui-spin--with-description'` — present iff
 *   `props.description !== undefined`.
 * - `'cx-ui-spin--hidden'` — present iff `!props.show`. Drives
 *   `display: none` (preserves animation state in case the consumer
 *   toggles `show` rather than unmounting).
 */
export function resolveSpinClassList(props: SpinProps): string[] {
  const classes = ['cx-ui-spin', `cx-ui-spin--${props.size}`];
  if (props.description !== undefined) classes.push('cx-ui-spin--with-description');
  if (!props.show) classes.push('cx-ui-spin--hidden');
  return classes;
}
