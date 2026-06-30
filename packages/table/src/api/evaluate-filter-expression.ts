import { getCellValue } from '../render/format-cell-value.js';

import type {
  ColumnSpec,
  ExpressionCompareNode,
  ExpressionValue,
  FilterExpression,
  RowSpec,
} from '../ir/index.js';

/**
 * Context passed to `buildExpressionPredicate` (2026-05-29).
 *
 * `columns` mirrors the surface that `filter-pass.ts` already consumes
 * — needed at compile time so every compare leaf can resolve its
 * `colId` to a `ColumnSpec` (which is the lookup target for
 * `valueGetter` + `filterable === false` rejection).
 */
export interface EvaluateFilterExpressionContext {
  readonly columns: readonly ColumnSpec[];
}

/**
 * Pre-scan a filter expression for unknown or non-filterable column
 * references. Returns `true` when EVERY compare leaf's `colId`
 * resolves to a known column with `filterable !== false`. Used by
 * `filterPass.ts` to mirror its existing atomic-rejection semantics
 * before compiling the predicate.
 */
export function expressionReferencesValidColumns(
  expression: FilterExpression,
  columns: readonly ColumnSpec[],
): boolean {
  const columnsById = new Map<string, ColumnSpec>();
  for (const column of columns) {
    columnsById.set(column.id, column);
  }
  return walkValidate(expression, columnsById);
}

function walkValidate(
  expression: FilterExpression,
  columnsById: ReadonlyMap<string, ColumnSpec>,
): boolean {
  if (expression.kind === 'and' || expression.kind === 'or') {
    for (const child of expression.children) {
      if (!walkValidate(child, columnsById)) return false;
    }
    return true;
  }
  if (expression.kind === 'not') {
    return walkValidate(expression.child, columnsById);
  }
  const column = columnsById.get(expression.colId);
  if (column == null) return false;
  if (column.filterable === false) return false;
  return true;
}

/**
 * Compile a `FilterExpression` AST into a per-row predicate closure
 * . The AST is walked once at compile time; the resulting
 * function is a plain `(row: RowSpec) => boolean` that the per-row
 * AND walk inside `filterPass` can call without further allocation.
 *
 * Compare-leaf semantics:
 *
 * - `=` / `!=` / `>` / `<` / `>=` / `<=` — numeric coercion via
 *   `coerceToNumber` (same shape as `filter-pass.ts`'s number-spec
 *   predicate). `=` and `!=` additionally accept string equality
 *   when both sides coerce to text (per `coerceToText`). Boolean
 *   and null comparisons fall through to the typed branches.
 * - `contains` / `startsWith` / `endsWith` — case-insensitive
 *   substring tests via `coerceToText` (mirroring text-
 *   filter's default).
 * - `in` — true when the cell value (after `coerceToText` /
 *   `coerceToNumber`) equals ANY entry of the `value` array. Null
 *   entries in the array match null cell values.
 * - `isNull` — true when the raw cell value is `null` /
 *   `undefined` / missing key.
 * - `isNotNull` — inverse of `isNull`.
 *
 * Pure function. The returned predicate closes over `columns` +
 * `expression` but doesn't allocate per call.
 */
export function buildExpressionPredicate(
  expression: FilterExpression,
  context: EvaluateFilterExpressionContext,
): (row: RowSpec) => boolean {
  const columnsById = new Map<string, ColumnSpec>();
  for (const column of context.columns) {
    columnsById.set(column.id, column);
  }
  return compile(expression, columnsById);
}

function compile(
  expression: FilterExpression,
  columnsById: ReadonlyMap<string, ColumnSpec>,
): (row: RowSpec) => boolean {
  if (expression.kind === 'and') {
    const childFns = expression.children.map((c) => compile(c, columnsById));
    return (row) => {
      for (const fn of childFns) {
        if (!fn(row)) return false;
      }
      return true;
    };
  }
  if (expression.kind === 'or') {
    const childFns = expression.children.map((c) => compile(c, columnsById));
    return (row) => {
      for (const fn of childFns) {
        if (fn(row)) return true;
      }
      return false;
    };
  }
  if (expression.kind === 'not') {
    const inner = compile(expression.child, columnsById);
    return (row) => !inner(row);
  }
  return compileCompare(expression, columnsById);
}

function compileCompare(
  node: ExpressionCompareNode,
  columnsById: ReadonlyMap<string, ColumnSpec>,
): (row: RowSpec) => boolean {
  const column = columnsById.get(node.colId);
  if (column == null || column.filterable === false) {
    // Defensive — `filter-pass.ts` rejects atomically before reaching
    // this path. Falling closed protects against direct programmatic
    // callers that skip the pre-scan.
    return () => false;
  }
  const { operator, value } = node;

  if (operator === 'isNull') {
    return (row) => {
      const raw = getCellValue({ row, column });
      return raw == null;
    };
  }
  if (operator === 'isNotNull') {
    return (row) => {
      const raw = getCellValue({ row, column });
      return raw != null;
    };
  }

  if (operator === 'contains' || operator === 'startsWith' || operator === 'endsWith') {
    const needleText = coerceLiteralToText(value);
    if (needleText == null) return () => false;
    const needle = needleText.toLowerCase();
    return (row) => {
      const raw = getCellValue({ row, column });
      const text = coerceToText(raw);
      if (text == null) return false;
      const hay = text.toLowerCase();
      if (operator === 'contains') return hay.includes(needle);
      if (operator === 'startsWith') return hay.startsWith(needle);
      return hay.endsWith(needle);
    };
  }

  if (operator === 'in') {
    const values: readonly ExpressionValue[] = Array.isArray(value) ? value : [];
    return (row) => {
      const raw = getCellValue({ row, column });
      for (const candidate of values) {
        if (literalEquals(raw, candidate)) return true;
      }
      return false;
    };
  }

  // 6 binary operators.
  return (row) => {
    const raw = getCellValue({ row, column });
    return binaryCompare(raw, operator, value);
  };
}

function binaryCompare(
  raw: unknown,
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=',
  literal: ExpressionValue,
): boolean {
  // Null literal: only `=` (matches null cell) and `!=` (matches
  // non-null cell) are meaningful. Other operators against null
  // collapse to false (NaN-style semantics).
  if (literal == null) {
    if (operator === '=') return raw == null;
    if (operator === '!=') return raw != null;
    return false;
  }

  if (typeof literal === 'boolean') {
    if (operator === '=') return raw === literal;
    if (operator === '!=') return raw !== literal;
    return false;
  }

  if (typeof literal === 'number') {
    const n = coerceToNumber(raw);
    if (n == null) return false;
    if (operator === '=') return n === literal;
    if (operator === '!=') return n !== literal;
    if (operator === '>') return n > literal;
    if (operator === '<') return n < literal;
    if (operator === '>=') return n >= literal;
    return n <= literal;
  }

  if (typeof literal === 'string') {
    const text = coerceToText(raw);
    if (text == null) return false;
    if (operator === '=') return text === literal;
    if (operator === '!=') return text !== literal;
    if (operator === '>') return text > literal;
    if (operator === '<') return text < literal;
    if (operator === '>=') return text >= literal;
    return text <= literal;
  }

  return false;
}

function literalEquals(raw: unknown, literal: ExpressionValue): boolean {
  if (literal == null) return raw == null;
  if (typeof literal === 'boolean') return raw === literal;
  if (typeof literal === 'number') {
    const n = coerceToNumber(raw);
    return n != null && n === literal;
  }
  if (typeof literal === 'string') {
    const text = coerceToText(raw);
    return text != null && text === literal;
  }
  return false;
}

function coerceLiteralToText(value: ExpressionValue): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return null;
}

function coerceToText(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
    return String(raw);
  }
  if (raw instanceof Date) return raw.toISOString();
  return null;
}

function coerceToNumber(raw: unknown): number | null {
  if (typeof raw !== 'number') return null;
  if (!Number.isFinite(raw)) return null;
  return raw;
}
