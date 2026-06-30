/**
 * Statistic IR — . Tier A numeric display.
 *
 * Renders a `(label, prefix, value, suffix)` block for KPI / dashboard
 * / summary widgets. Prefix + suffix surface via adapter slots (Vue)
 * / props (React) — the adapter passes `hasPrefix` / `hasSuffix`
 * booleans to `resolveStatisticClassList` so the BEM `--with-prefix` /
 * `--with-suffix` modifiers are stable across frameworks.
 *
 * Public surface:
 *
 * - **`StatisticProps`** + **`defaultStatisticProps`**.
 * - **`STATISTIC_PLACEHOLDER`** — `'-'` literal returned for missing /
 *   non-finite numeric values.
 * - **`formatStatisticValue`** pure helper.
 * - **`resolveStatisticClassList`** pure helper.
 */

export interface StatisticProps {
  /** Heading label above the value. `undefined` omits the label row. */
  readonly label: string | undefined;
  /**
   * The displayed value. Numeric values pass through
   * `formatStatisticValue`; string values render verbatim; `undefined`
   * renders the placeholder `'-'`.
   */
  readonly value: number | string | undefined;
  /**
   * Decimal precision applied to numeric values via
   * `value.toFixed(precision)`. Ignored for string values. `undefined`
   * means "no fixed-decimal coercion" (render verbatim).
   */
  readonly precision: number | undefined;
  /**
   * When `true` (default), applies `font-variant-numeric:
   * tabular-nums` for monospaced digit widths. Useful in dashboard
   * tables where columns should align.
   */
  readonly tabularNums: boolean;
}

export const defaultStatisticProps: StatisticProps = {
  label: undefined,
  value: undefined,
  precision: undefined,
  tabularNums: true,
};
