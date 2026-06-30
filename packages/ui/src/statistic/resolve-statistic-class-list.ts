import type { StatisticProps } from './statistic-spec.js';

/**
 * Compute class set for the Statistic root element.
 *
 * .
 *
 * `hasPrefix` + `hasSuffix` come from the adapter (whether the
 * respective slot / prop resolved to content).
 *
 * Class structure:
 *
 * - `'cx-ui-statistic'` — always present.
 * - `'cx-ui-statistic--with-label'` — present iff `props.label !== undefined`.
 * - `'cx-ui-statistic--with-prefix'` — present iff `hasPrefix`.
 * - `'cx-ui-statistic--with-suffix'` — present iff `hasSuffix`.
 * - `'cx-ui-statistic--tabular-nums'` — present iff
 *   `props.tabularNums` (default `true`).
 */
export function resolveStatisticClassList(
  props: StatisticProps,
  hasPrefix: boolean,
  hasSuffix: boolean,
): string[] {
  const classes = ['cx-ui-statistic'];
  if (props.label !== undefined) classes.push('cx-ui-statistic--with-label');
  if (hasPrefix) classes.push('cx-ui-statistic--with-prefix');
  if (hasSuffix) classes.push('cx-ui-statistic--with-suffix');
  if (props.tabularNums) classes.push('cx-ui-statistic--tabular-nums');
  return classes;
}
