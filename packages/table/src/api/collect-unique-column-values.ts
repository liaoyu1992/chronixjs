import { getCellValue } from '../render/format-cell-value.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Input to `collectUniqueColumnValues` (2026-05-29).
 *
 * - `rows` is the FULL row population to walk — typically the
 *   `props.rows` passed to the table, NOT the post-filter
 *   `filteredRows`. The Excel-style set filter needs ALL unique
 *   values so users can re-tick a value they previously unchecked
 *   (per Decision C.1).
 * - `column` carries the `valueGetter` / `field` / `id` lookup
 *   strategy for each cell.
 * - `maxValues` caps the unique-value count to protect against
 *   pathological wide-cardinality columns. Defaults to 10000.
 *   Reaching the cap surfaces `truncated: true` on the result so
 *   the adapter can render a "list truncated" notice.
 */
export interface CollectUniqueColumnValuesInput {
  readonly rows: readonly RowSpec[];
  readonly column: ColumnSpec;
  readonly maxValues?: number;
}

/**
 * One entry in the unique-value list. `value` is the column's coerced
 * cell value (or `null` for missing / undefined / object cells).
 * `count` is the number of rows in the input that map to this value.
 */
export interface ColumnUniqueValue {
  readonly value: string | number | boolean | null;
  readonly count: number;
}

/**
 * Result envelope. `truncated` is `true` when the unique-value count
 * exceeded `maxValues`; the returned `values` array contains only the
 * first `maxValues` entries after sorting.
 */
export interface CollectUniqueColumnValuesResult {
  readonly values: readonly ColumnUniqueValue[];
  readonly truncated: boolean;
}

const DEFAULT_MAX_VALUES = 10000;

/**
 * Collect unique cell values for a column from a row population
 * (2026-05-29).
 *
 * Algorithm:
 *
 * 1. Walk `rows`; for each row resolve the cell via `getCellValue`
 *    (which honors `column.valueGetter` / `column.field` / `column.id`).
 * 2. Coerce the raw cell value into a canonical leaf type
 *    (`string` / `number` / `boolean` / `null`). Objects / functions
 *    / symbols / NaN / Infinity → `null` (mirrors the
 *    text-filter coercion path so the set-filter list and the
 *    text-filter predicate agree on what counts as a "value").
 *    `bigint` and `Date` stringify (via `String(big)` / `toISOString`).
 * 3. Maintain a `Map<key, {value, count}>` keyed by a JSON-style
 *    discriminator that distinguishes `0` (number) from `'0'`
 *    (string) from `false` (boolean).
 * 4. Sort: numbers ascending → strings ascending (lexicographic) →
 *    booleans (false < true) → `null` last.
 * 5. Cap to `maxValues` (default 10000) and surface `truncated: true`
 *    when the cap is hit.
 *
 * Pure function. No mutation of inputs.
 */
export function collectUniqueColumnValues(
  input: CollectUniqueColumnValuesInput,
): CollectUniqueColumnValuesResult {
  const { rows, column, maxValues = DEFAULT_MAX_VALUES } = input;

  if (maxValues <= 0) {
    return { values: [], truncated: rows.length > 0 };
  }

  const seen = new Map<string, { value: string | number | boolean | null; count: number }>();
  for (const row of rows) {
    const raw = getCellValue({ row, column });
    const coerced = coerceLeaf(raw);
    const key = leafKey(coerced);
    const existing = seen.get(key);
    if (existing == null) {
      seen.set(key, { value: coerced, count: 1 });
    } else {
      seen.set(key, { value: existing.value, count: existing.count + 1 });
    }
  }

  const entries: ColumnUniqueValue[] = [];
  for (const v of seen.values()) {
    entries.push({ value: v.value, count: v.count });
  }
  entries.sort(compareLeafEntries);

  if (entries.length > maxValues) {
    return { values: entries.slice(0, maxValues), truncated: true };
  }
  return { values: entries, truncated: false };
}

function coerceLeaf(raw: unknown): string | number | boolean | null {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    return raw;
  }
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'bigint') return String(raw);
  if (raw instanceof Date) return raw.toISOString();
  return null;
}

function leafKey(value: string | number | boolean | null): string {
  if (value === null) return 'N:';
  if (typeof value === 'number') return `n:${value}`;
  if (typeof value === 'boolean') return `b:${String(value)}`;
  return `s:${value}`;
}

function compareLeafEntries(a: ColumnUniqueValue, b: ColumnUniqueValue): number {
  const ar = leafRank(a.value);
  const br = leafRank(b.value);
  if (ar !== br) return ar - br;
  if (typeof a.value === 'number' && typeof b.value === 'number') {
    return a.value - b.value;
  }
  if (typeof a.value === 'string' && typeof b.value === 'string') {
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
  }
  if (typeof a.value === 'boolean' && typeof b.value === 'boolean') {
    return (a.value ? 1 : 0) - (b.value ? 1 : 0);
  }
  return 0;
}

function leafRank(value: string | number | boolean | null): number {
  if (typeof value === 'number') return 0;
  if (typeof value === 'string') return 1;
  if (typeof value === 'boolean') return 2;
  return 3;
}
