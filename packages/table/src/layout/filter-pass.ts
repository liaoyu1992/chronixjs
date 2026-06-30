import {
  buildExpressionPredicate,
  expressionReferencesValidColumns,
} from '../api/evaluate-filter-expression.js';
import { getCellValue } from '../render/format-cell-value.js';

import type {
  ColumnSpec,
  ExpressionFilterSpec,
  FilterSpec,
  MultiFilterChild,
  MultiFilterEntry,
  MultiFilterSpec,
  NumberFilterOperator,
  NumberFilterSpec,
  RowSpec,
  SetFilterSpec,
  TextFilterOperator,
  TextFilterSpec,
} from '../ir/index.js';

/**
 * Input to `filterPass` (2026-05-24).
 *
 * `filterSpec` is `readonly FilterSpec[]` with multi-column AND
 * semantics — a row must pass EVERY entry to be included. Empty
 * array / null / undefined is the identity case.
 *
 * The pass needs the `columns` array (not just the active columns)
 * so it can look up each spec's column by `colId` + honor each
 * column's `filterable` / `valueGetter`.
 */
export interface FilterPassInput {
  readonly rows: readonly RowSpec[];
  readonly filterSpec: readonly FilterSpec[] | null | undefined;
  readonly columns: readonly ColumnSpec[];
}

/**
 * Output of `filterPass`.
 *
 * `filteredRows` is a NEW array when the pass actually filters; when
 * the spec is empty / nullish OR every entry's `value` is empty (no
 * exclusion), the input array is returned by reference (consumers
 * can identity-check the result to skip downstream work).
 *
 * `rejected` is `true` when ANY entry references a non-existent
 * `colId` OR a column with `filterable === false`. Atomic rejection
 * matches `sortPass` semantics — either the whole filter
 * applies or nothing does.
 *
 * `filterForceExpandedRowIds` (2026-05-28): row IDs of
 * ancestors whose children matched the filter while the ancestors
 * themselves did NOT match. Empty when no filter is active or when
 * no row carries `children`. Adapters union this set with the user's
 * expandedRowIds before calling `treeFlattenPass` so that filtered
 * matches are always visible regardless of the user's manual expand
 * state. Decision F.1 of `TABLE_PHASE_30_TREE_DATA_DESIGN.md`.
 */
export interface FilterPassResult {
  readonly filteredRows: readonly RowSpec[];
  readonly rejected: boolean;
  readonly filterForceExpandedRowIds: readonly string[];
}

/**
 * Predicate that decides whether a row passes a single resolved
 * filter spec. Returns `true` when the row should be retained.
 */
type FilterPredicate = (row: RowSpec) => boolean;

/**
 * Filter rows by a list of per-column filter specs (multi-column AND).
 *
 * Algorithm:
 *
 * 1. **Empty / null spec** → identity. Returns
 *    `{filteredRows: rows, rejected: false}`.
 * 2. **Column lookup + predicate construction**. Walk the spec
 *    array; for each entry resolve the matching column. When ANY
 *    entry's `colId` is unknown OR the column has `filterable ===
 *    false`, return `{filteredRows: rows, rejected: true}` (atomic
 *    rejection — matches sortPass).
 *    Empty-value entries (`value === ''`) compile to a tautology
 *    predicate (`() => true`) so the user can render an always-on
 *    filter input row without blank inputs hiding rows.
 * 3. **Active-filter short-circuit**. If after resolution NO spec
 *    has a non-empty value (all filter inputs blank), return the
 *    input array by reference. Avoids allocating a copy for the
 *    common "filter row rendered, nothing typed" case.
 * 4. **Per-row AND walk**. Iterate `rows`; keep rows where every
 *    predicate returns `true`. Predicates execute in spec order;
 *    JS short-circuits on first `false`.
 * 5. Return `{filteredRows, rejected: false}`.
 *
 * **Pure function.** No mutation of inputs.
 */
export function filterPass(input: FilterPassInput): FilterPassResult {
  const { rows, filterSpec, columns } = input;
  if (filterSpec == null || filterSpec.length === 0) {
    return { filteredRows: rows, rejected: false, filterForceExpandedRowIds: [] };
  }

  // Resolve every spec entry up front: column lookup + predicate
  // construction. Reject atomically on first invalid colId / non-
  // filterable column.
  const predicates: FilterPredicate[] = [];
  let anyActive = false;
  for (const spec of filterSpec) {
    if (spec.type === 'expression') {
      if (!expressionReferencesValidColumns(spec.expression, columns)) {
        return { filteredRows: rows, rejected: true, filterForceExpandedRowIds: [] };
      }
      const predicate = buildExpressionPredicate(spec.expression, { columns });
      predicates.push(predicate);
      anyActive = true;
      continue;
    }
    const column = columns.find((c) => c.id === spec.colId);
    if (column == null || column.filterable === false) {
      return { filteredRows: rows, rejected: true, filterForceExpandedRowIds: [] };
    }
    const predicate = buildPredicate(spec, column);
    if (predicate != null) {
      predicates.push(predicate);
      anyActive = true;
    }
  }

  // No active predicate (all values empty / blank) → identity.
  if (!anyActive) {
    return { filteredRows: rows, rejected: false, filterForceExpandedRowIds: [] };
  }

  const rowMatches = (row: RowSpec): boolean => {
    for (const predicate of predicates) {
      if (!predicate(row)) return false;
    }
    return true;
  };

  // when ANY row has `children`, walk
  // recursively so ancestors of matching descendants are preserved.
  // Decision F.1 of `TABLE_PHASE_30_TREE_DATA_DESIGN.md`.
  if (hasAnyChildren(rows)) {
    const forceExpanded: string[] = [];
    const filteredRows = filterTreeRows(rows, rowMatches, forceExpanded);
    return { filteredRows, rejected: false, filterForceExpandedRowIds: forceExpanded };
  }

  const filteredRows = rows.filter(rowMatches);
  return { filteredRows, rejected: false, filterForceExpandedRowIds: [] };
}

/**
 * tree-aware filter walk. Returns the pruned tree where
 * every retained ancestor either matches the filter OR has at least
 * one matching descendant. Ancestors retained ONLY because of a
 * descendant match are pushed into `forceExpanded` (the caller
 * unions this with the user's expandedRowIds so the matching
 * descendants are visible regardless of manual collapse state).
 *
 * Pure-recursive — depth is bounded by tree depth, which chronix
 * does not promise to be small but real-world consumers stay well
 * under JS engine stack limits. `treeFlattenPass` uses an explicit
 * stack for its own walk; here we accept the recursion since the
 * filter walk only runs when filterSpec is active (much less
 * frequent than every-frame flatten).
 */
function filterTreeRows(
  rows: readonly RowSpec[],
  rowMatches: (row: RowSpec) => boolean,
  forceExpanded: string[],
): readonly RowSpec[] {
  const out: RowSpec[] = [];
  for (const row of rows) {
    const selfMatches = rowMatches(row);
    const children = row.children;
    if (children != null && children.length > 0) {
      const prunedChildren = filterTreeRows(children, rowMatches, forceExpanded);
      if (prunedChildren.length > 0) {
        // Either the row matches itself OR a descendant survived.
        if (!selfMatches) forceExpanded.push(row.id);
        // Allocate a new RowSpec with the pruned children. We preserve
        // every other field (id, data, depth, groupKey, heightHint).
        out.push({ ...row, children: prunedChildren });
        continue;
      }
      // Descendants all pruned — keep the row only if it matches itself.
      if (selfMatches) {
        // The row's children are all pruned; emit it as a leaf-shaped
        // entity (empty children array preserves the original IR shape
        // signal that this was a parent; treeFlattenPass treats it as
        // no children either way).
        out.push({ ...row, children: [] });
      }
    } else if (selfMatches) {
      // Leaf row that matches → keep as-is.
      out.push(row);
    }
  }
  return out;
}

/** Cheap top-level check: does ANY row carry children? */
function hasAnyChildren(rows: readonly RowSpec[]): boolean {
  for (const row of rows) {
    if (row.children != null && row.children.length > 0) return true;
  }
  return false;
}

/**
 * Build a per-row predicate for a single filter spec.
 *
 * Returns `null` when the spec is a no-op (e.g., empty text value);
 * the caller skips appending the predicate so the rest of the
 * pipeline doesn't pay per-row dispatch cost for it.
 */
function buildPredicate(
  spec: Exclude<FilterSpec, ExpressionFilterSpec>,
  column: ColumnSpec,
): FilterPredicate | null {
  if (spec.type === 'text') {
    return buildTextPredicate(spec, column);
  }
  if (spec.type === 'number') {
    return buildNumberPredicate(spec, column);
  }
  if (spec.type === 'set') {
    return buildSetPredicate(spec, column);
  }
  if (spec.type === 'multi') {
    return buildMultiPredicate(spec, column);
  }
  // Defensive default for future-variant case: an unhandled `type`
  // lets every row through. + will widen the union.
  return null;
}

/**
 * build a per-row predicate for the
 * multi-filter container. Recursively constructs child predicates
 * via the existing text + number predicate factories (re-used by
 * synthesizing a "headless-child → full-spec" shim with the parent's
 * `colId`), then combines via mode-aware AND-or-OR reducer.
 *
 * Empty `filters` array OR all-empty-value children → returns `null`
 * (the caller's `anyActive` short-circuit keeps the input array
 * identity, matching the per-spec empty-text-value pattern from
 *).
 *
 * Combination semantics:
 *
 * - `'AND'` mode: every active child predicate must accept the row.
 *   Empty-child predicates (which represent as a
 *   null factory result) are dropped from the combine — they're
 *   tautologies and contribute nothing.
 * - `'OR'` mode: at least one active child predicate must accept.
 *   Empty children dropped same as AND. If ALL children are empty
 *   → the multi predicate is null (identity).
 *
 * Pure function. Iterates `filters` once at compile time; per-row
 * dispatch cost = sum of child predicates' costs (text contains is
 * O(haystack), number comparison is O(1), etc.).
 */
function buildMultiPredicate(spec: MultiFilterSpec, column: ColumnSpec): FilterPredicate | null {
  // + 117: build predicates over the (possibly recursive)
  // `MultiFilterEntry[]`. Leaf children synthesize per;
  // nested groups recurse via `buildMultiEntryPredicate` and combine
  // their own children's predicates per the group's `mode`.
  const childPredicates: FilterPredicate[] = [];
  for (const entry of spec.filters) {
    const predicate = buildMultiEntryPredicate(entry, column);
    if (predicate != null) childPredicates.push(predicate);
  }
  if (childPredicates.length === 0) return null;
  return combineByMode(childPredicates, spec.mode);
}

/**
 * combine an array of predicates per a
 * group/spec `mode`. Factored 's inline AND/OR loop so
 * the root-level multi-filter combine and every nested-group combine
 * share one implementation.
 */
function combineByMode(
  predicates: readonly FilterPredicate[],
  mode: 'AND' | 'OR',
): FilterPredicate {
  if (mode === 'OR') {
    return (row) => {
      for (const predicate of predicates) {
        if (predicate(row)) return true;
      }
      return false;
    };
  }
  return (row) => {
    for (const predicate of predicates) {
      if (!predicate(row)) return false;
    }
    return true;
  };
}

/**
 * + 117: synthesize a predicate from a single
 * `MultiFilterEntry`. Leaf children re-use the
 * factories via "headless-child → full-spec" synthesis. Group entries
 * recurse — their own children's predicates combine per the group's
 * `mode`.
 *
 * Identity propagation: an entry whose every active child returns
 * null predicate (all-empty text / null set / all-empty subgroup)
 * itself returns null — matches the root-level `anyActive`
 * short-circuit.
 */
function buildMultiEntryPredicate(
  entry: MultiFilterEntry,
  column: ColumnSpec,
): FilterPredicate | null {
  if (entry.type === 'group') {
    const childPredicates: FilterPredicate[] = [];
    for (const child of entry.filters) {
      const predicate = buildMultiEntryPredicate(child, column);
      if (predicate != null) childPredicates.push(predicate);
    }
    if (childPredicates.length === 0) return null;
    return combineByMode(childPredicates, entry.mode);
  }
  return buildMultiChildPredicate(entry, column);
}

/**
 * helper: synthesize a full single-column predicate from a
 * headless `MultiFilterChild`. Reuses the factories by
 * re-attaching the parent's `colId` (the factories accept the full
 * spec shape — text needs `colId`, number ditto). The synthetic
 * full-shape spec is allocated once per filterPass call, not per row.
 */
function buildMultiChildPredicate(
  child: MultiFilterChild,
  column: ColumnSpec,
): FilterPredicate | null {
  if (child.type === 'text') {
    const fullSpec: TextFilterSpec = {
      type: 'text',
      colId: column.id,
      operator: child.operator,
      value: child.value,
      ...(child.caseSensitive === true ? { caseSensitive: true } : {}),
    };
    return buildTextPredicate(fullSpec, column);
  }
  if (child.type === 'set') {
    // set-child synthesizes a full SetFilterSpec
    // by re-attaching the parent's colId, then dispatches to the existing
    // buildSetPredicate. selectedValues: null → identity (slot
    // inactive; multi-filter's anyActive counter doesn't trip since
    // buildSetPredicate returns null on the identity case).
    const fullSpec: SetFilterSpec = {
      type: 'set',
      colId: column.id,
      selectedValues: child.selectedValues,
    };
    return buildSetPredicate(fullSpec, column);
  }
  // number child
  const fullSpec: NumberFilterSpec = {
    type: 'number',
    colId: column.id,
    operator: child.operator,
    value: child.value,
    ...(child.valueTo !== undefined ? { valueTo: child.valueTo } : {}),
  };
  return buildNumberPredicate(fullSpec, column);
}

/**
 * build a per-row predicate for a set-filter
 * spec. `selectedValues: null` is the identity case (handled by the
 * factory returning null so the pass's `anyActive` counter doesn't
 * trip — same shape as empty-text-value). `selectedValues: []` is the
 * vacuous-false case (no rows pass). Otherwise the predicate tests
 * the coerced cell value against a `Set` (O(1) per row regardless of
 * how many values are selected).
 *
 * Cell-value coercion mirrors `collectUniqueColumnValues` so the
 * unique-value list and the predicate agree on what counts as a
 * "value" — numbers / strings / booleans pass through; bigint / Date
 * stringify; NaN / Infinity / objects / functions collapse to `null`
 * (matched only when the `selectedValues` array contains `null`).
 */
function buildSetPredicate(spec: SetFilterSpec, column: ColumnSpec): FilterPredicate | null {
  const { selectedValues } = spec;
  if (selectedValues == null) return null;
  if (selectedValues.length === 0) {
    // Vacuous-false: no values selected → no rows pass.
    return () => false;
  }
  const selectionSet = new Set<string>();
  for (const v of selectedValues) {
    selectionSet.add(setMembershipKey(v));
  }
  return (row) => {
    const raw = getCellValue({ row, column });
    return selectionSet.has(setMembershipKey(coerceToLeaf(raw)));
  };
}

/**
 * Coerce a raw cell value into the leaf type the set-filter compares
 * against. Mirrors `collectUniqueColumnValues.coerceLeaf` shape — keep
 * the two in sync so the dropdown list and the predicate agree.
 */
function coerceToLeaf(raw: unknown): string | number | boolean | null {
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

/**
 * Stable hash key for set-membership lookup. Type-prefixed so `0`
 * (number) and `'0'` (string) and `false` (boolean) don't collide.
 */
function setMembershipKey(value: string | number | boolean | null): string {
  if (value === null) return 'N:';
  if (typeof value === 'number') return `n:${value}`;
  if (typeof value === 'boolean') return `b:${String(value)}`;
  return `s:${value}`;
}

function buildTextPredicate(spec: TextFilterSpec, column: ColumnSpec): FilterPredicate | null {
  // Empty value → tautology (no exclusion). Allows consumers to
  // render the filter input row without blanking the table on
  // mount.
  if (spec.value === '') return null;

  const caseSensitive = spec.caseSensitive === true;
  const needle = caseSensitive ? spec.value : spec.value.toLowerCase();
  const operatorFn = textOperatorFn(spec.operator);

  return (row) => {
    const raw = getCellValue({ row, column });
    const hay = coerceToText(raw);
    if (hay == null) return false;
    const haystack = caseSensitive ? hay : hay.toLowerCase();
    return operatorFn(haystack, needle);
  };
}

/**
 * narrow a cell value into a string for filter matching.
 * Returns `null` (predicate fails) for values that can't be cleanly
 * stringified — objects, functions, symbols. Matches the spirit of
 * `defaultFormatCellValue` (which surfaces `'[object]'` placeholder
 * for these cases) but the filter excludes them rather than letting
 * `'[object'` substrings match.
 */
function coerceToText(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
    return String(raw);
  }
  if (raw instanceof Date) return raw.toISOString();
  return null;
}

/**
 * text operators. Single allocation per filter spec (the
 * predicate factory caches it); not per-row.
 */
function textOperatorFn(
  operator: TextFilterOperator,
): (haystack: string, needle: string) => boolean {
  switch (operator) {
    case 'contains':
      return (haystack, needle) => haystack.includes(needle);
    case 'equals':
      return (haystack, needle) => haystack === needle;
    case 'startsWith':
      return (haystack, needle) => haystack.startsWith(needle);
    case 'endsWith':
      return (haystack, needle) => haystack.endsWith(needle);
  }
}

/**
 * build a per-row predicate for a number-
 * filter spec. Coerces cell value to finite number; predicate fails
 * for non-numeric / NaN / Infinity cell values (consumers with
 * mixed-type columns should supply `valueGetter` to return a number).
 *
 * `inRange` requires both endpoints — when `valueTo` is omitted, the
 * spec is treated as `>= value` (degenerate range collapses to a
 * half-open lower bound). This is a defensive shim; the SFC parser
 * always emits `valueTo` for inRange specs.
 */
function buildNumberPredicate(spec: NumberFilterSpec, column: ColumnSpec): FilterPredicate | null {
  const opFn = numberOperatorFn(spec.operator, spec.value, spec.valueTo);
  return (row) => {
    const raw = getCellValue({ row, column });
    const n = coerceToNumber(raw);
    if (n == null) return false;
    return opFn(n);
  };
}

/**
 * narrow a cell value to a finite number. Returns `null`
 * for any non-number (string / boolean / null / undefined / object)
 * and for NaN / Infinity / -Infinity. Symmetric to `coerceToText`.
 */
function coerceToNumber(raw: unknown): number | null {
  if (typeof raw !== 'number') return null;
  if (!Number.isFinite(raw)) return null;
  return raw;
}

/**
 * build the per-value comparison function for a number
 * operator. The `value` (and `valueTo` for inRange) are captured
 * once in the closure — single allocation per filter spec, not per
 * row comparison.
 */
function numberOperatorFn(
  operator: NumberFilterOperator,
  value: number,
  valueTo: number | undefined,
): (x: number) => boolean {
  switch (operator) {
    case '=':
      return (x) => x === value;
    case '!=':
      return (x) => x !== value;
    case '>':
      return (x) => x > value;
    case '<':
      return (x) => x < value;
    case '>=':
      return (x) => x >= value;
    case '<=':
      return (x) => x <= value;
    case 'inRange': {
      // Degenerate-range fallback: when valueTo is missing, treat as
      // half-open `>= value`. The SFC parser always emits valueTo;
      // this branch protects against programmatic setFilter callers.
      if (valueTo == null) return (x) => x >= value;
      const lo = Math.min(value, valueTo);
      const hi = Math.max(value, valueTo);
      return (x) => x >= lo && x <= hi;
    }
  }
}
