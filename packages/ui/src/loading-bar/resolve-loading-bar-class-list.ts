import type { LoadingBarState } from './loading-bar-spec.js';

/**
 * Input for `resolveLoadingBarClassList`.
 *
 * .
 */
export interface ResolveLoadingBarClassListInput {
  readonly state: LoadingBarState;
}

/**
 * Compute class set for a LoadingBar root element.
 *
 * Class structure:
 *
 * - `'cx-ui-loading-bar'` — always present.
 * - `'cx-ui-loading-bar--loading'` — bar is animating.
 * - `'cx-ui-loading-bar--finishing'` — bar is completing (shrink to 100%).
 * - `'cx-ui-loading-bar--error'` — bar shows error state (red).
 *
 * The `idle` state has no modifier — the bar is hidden.
 */
export function resolveLoadingBarClassList(input: ResolveLoadingBarClassListInput): string[] {
  const classes: string[] = ['cx-ui-loading-bar'];
  if (input.state !== 'idle') {
    classes.push(`cx-ui-loading-bar--${input.state}`);
  }
  return classes;
}
