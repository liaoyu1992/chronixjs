import type { CountdownProps } from './countdown-spec.js';

/**
 * Compute class set for the Countdown root element.
 *
 * Phase 18 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-countdown'` — always present.
 * - `'cx-ui-countdown--tabular-nums'` — always present. Countdowns
 *   ALWAYS use tabular-nums for digit alignment (the displayed
 *   string ticks every interval; without tabular-nums the layout
 *   jitters on every digit change).
 * - `'cx-ui-countdown--with-label'` — present iff
 *   `props.label !== undefined`.
 * - `'cx-ui-countdown--paused'` — present iff `!props.active`.
 *   Useful for theming a "stopped" visual state.
 * - `'cx-ui-countdown--with-prefix'` / `'cx-ui-countdown--with-suffix'`
 *   — present per the adapter-supplied booleans.
 */
export function resolveCountdownClassList(
  props: CountdownProps,
  hasPrefix: boolean,
  hasSuffix: boolean,
): string[] {
  const classes = ['cx-ui-countdown', 'cx-ui-countdown--tabular-nums'];
  if (props.label !== undefined) classes.push('cx-ui-countdown--with-label');
  if (!props.active) classes.push('cx-ui-countdown--paused');
  if (hasPrefix) classes.push('cx-ui-countdown--with-prefix');
  if (hasSuffix) classes.push('cx-ui-countdown--with-suffix');
  return classes;
}
