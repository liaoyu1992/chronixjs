import type { StepStatus } from './steps-spec.js';

/**
 * Compute class set for a single Step item element.
 *
 * .
 *
 * `derivedStatus` comes from `deriveStepItemStatus(item, idx,
 * current)` — the adapter computes it once per item and passes the
 * result here. `isCurrent` is `idx === current` (the active step,
 * regardless of whether its derived status is `'process'` or some
 * explicit override).
 *
 * Class structure:
 *
 * - `'cx-ui-steps__item'` — always present.
 * - `'cx-ui-steps__item--{derivedStatus}'` — one of `'wait' |
 *   'process' | 'finish' | 'error'`.
 * - `'cx-ui-steps__item--current'` — present iff `isCurrent` (the
 *   item is at the `current` index). Useful when the consumer
 *   explicitly overrode the active step's status (e.g. `'error'`
 *   on the active step) but still wants the "you are here"
 *   highlight.
 */
export function resolveStepItemClassList(derivedStatus: StepStatus, isCurrent: boolean): string[] {
  const classes = ['cx-ui-steps__item', `cx-ui-steps__item--${derivedStatus}`];
  if (isCurrent) classes.push('cx-ui-steps__item--current');
  return classes;
}
