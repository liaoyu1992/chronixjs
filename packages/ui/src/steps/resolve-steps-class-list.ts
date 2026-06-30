import { deriveStepItemStatus } from './derive-step-item-status.js';

import type { StepsProps } from './steps-spec.js';

/**
 * Compute class set for the Steps root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-steps'` — always present.
 * - `'cx-ui-steps--{direction}'` — one of `'horizontal' | 'vertical'`.
 * - `'cx-ui-steps--has-error'` — present iff any item's derived
 *   status is `'error'`. Lets consumers theme the whole sequence
 *   (e.g. red separators) when any failure is present without
 *   per-item walk in CSS.
 */
export function resolveStepsClassList(props: StepsProps): string[] {
  const classes = ['cx-ui-steps', `cx-ui-steps--${props.direction}`];
  const hasError = props.items.some(
    (item, idx) => deriveStepItemStatus(item, idx, props.current) === 'error',
  );
  if (hasError) classes.push('cx-ui-steps--has-error');
  return classes;
}
