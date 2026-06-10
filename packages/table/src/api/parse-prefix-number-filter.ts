import type { NumberFilterOperator, NumberFilterSpec } from '../ir/index.js';

/**
 * Phase 9.1 (2026-05-24): parse a single-input prefix-syntax string
 * into a `NumberFilterSpec`. Used by the SFC filter-row input on
 * `column.type === 'number'` columns.
 *
 * Recognized syntax (whitespace tolerated around the value but not
 * between the operator and digit):
 *
 * | Input string  | Resulting spec                                                |
 * | ------------- | ------------------------------------------------------------- |
 * | `'5'`         | `{operator:'=', value:5}`                                     |
 * | `'>10'`       | `{operator:'>', value:10}`                                    |
 * | `'<20'`       | `{operator:'<', value:20}`                                    |
 * | `'>=5'`       | `{operator:'>=', value:5}`                                    |
 * | `'<=10'`      | `{operator:'<=', value:10}`                                   |
 * | `'!=3'`       | `{operator:'!=', value:3}`                                    |
 * | `'=5'`        | `{operator:'=', value:5}` (explicit `=` prefix accepted)      |
 * | `'5..50'`     | `{operator:'inRange', value:5, valueTo:50}`                   |
 * | `'-3..-1'`    | `{operator:'inRange', value:-3, valueTo:-1}`                  |
 * | `'1.5..2.5'`  | `{operator:'inRange', value:1.5, valueTo:2.5}`                |
 * | `''`          | `null` (empty — no filter)                                    |
 * | `'abc'`       | `null` (invalid — treat as no filter)                         |
 * | `'>>5'`       | `null` (invalid — operator must be a single recognized token) |
 * | `'5..'`       | `null` (invalid — incomplete range)                           |
 *
 * Returns `null` for empty / invalid input so consumer SFCs can use
 * the result as "remove the spec entry for this column".
 *
 * Pure function. No DOM / no side effects.
 */
export function parsePrefixNumberFilter(value: string, colId: string): NumberFilterSpec | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  // Range first (`a..b`) — the `..` separator is unambiguous because
  // single-value operators don't contain dots.
  const rangeMatch = /^(-?\d+(?:\.\d+)?)\s*\.\.\s*(-?\d+(?:\.\d+)?)$/.exec(trimmed);
  if (rangeMatch != null) {
    const lo = Number(rangeMatch[1]);
    const hi = Number(rangeMatch[2]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
    return { type: 'number', colId, operator: 'inRange', value: lo, valueTo: hi };
  }

  // Single-value with optional operator prefix. The 2-char operators
  // (`>=`, `<=`, `!=`) match BEFORE the 1-char ones, which is why the
  // alternation is ordered.
  const singleMatch = /^(>=|<=|!=|>|<|=)?\s*(-?\d+(?:\.\d+)?)$/.exec(trimmed);
  if (singleMatch != null) {
    const op = (singleMatch[1] ?? '=') as NumberFilterOperator;
    const n = Number(singleMatch[2]);
    if (!Number.isFinite(n)) return null;
    return { type: 'number', colId, operator: op, value: n };
  }

  return null;
}

/**
 * Phase 9.1: inverse of `parsePrefixNumberFilter` — format a
 * `NumberFilterSpec` back into the prefix-syntax string. Used by
 * the SFC to round-trip `getFilter()` content into the input's
 * `value` attribute so external `setFilter` calls reactively
 * update the visible text.
 */
export function formatPrefixNumberFilter(spec: NumberFilterSpec): string {
  if (spec.operator === 'inRange') {
    return `${spec.value}..${spec.valueTo ?? ''}`;
  }
  if (spec.operator === '=') return String(spec.value);
  return `${spec.operator}${spec.value}`;
}
