import type { LogProps } from './log-spec.js';

/**
 * Compute class set for the Log root element.
 *
 * Phase 23 (2026-06-03).
 *
 * Class structure:
 *
 * - `'cx-ui-log'` — always present.
 * - `'cx-ui-log--with-line-numbers'` — when `props.lineNumbers`.
 *   The companion CSS rule reserves horizontal padding for the
 *   left number column; the adapter renders the per-line
 *   `<span class="__line-number">` text.
 * - `'cx-ui-log--loading'` — when `props.loading`. The adapter
 *   renders the trailing `__loading` row.
 * - `'cx-ui-log--wrap-lines'` — when `props.wrapLines`. The
 *   companion CSS rule flips `white-space: pre` → `pre-wrap`.
 */
export function resolveLogClassList(props: LogProps): string[] {
  const classes = ['cx-ui-log'];
  if (props.lineNumbers) classes.push('cx-ui-log--with-line-numbers');
  if (props.loading) classes.push('cx-ui-log--loading');
  if (props.wrapLines) classes.push('cx-ui-log--wrap-lines');
  return classes;
}
