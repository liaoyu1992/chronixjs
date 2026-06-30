/**
 * IR primitive: filter expression AST (2026-05-29).
 *
 * `FilterExpression` is a discriminated union over `kind` describing
 * a whole-row boolean expression tree assembled from AND / OR / NOT
 * combinators and per-column compare leaves. Authored by consumers
 * either literally (object-literal IR) or via the DSL parser
 * (`parseFilterExpression`); evaluated by `buildExpressionPredicate`
 * into a `(row: RowSpec) => boolean` closure that `filterPass`
 * consumes through the `ExpressionFilterSpec` variant.
 *
 * The IR is intentionally framework-agnostic and JSON-serializable
 * (no functions, no symbols) so a consumer can round-trip an
 * expression through localStorage / URL state / saved-views.
 */
export type FilterExpression =
  | ExpressionAndNode
  | ExpressionOrNode
  | ExpressionNotNode
  | ExpressionCompareNode;

/** N-ary AND: every child must evaluate true for the node to be true. */
export interface ExpressionAndNode {
  readonly kind: 'and';
  readonly children: readonly FilterExpression[];
}

/** N-ary OR: any child evaluating true makes the node true. */
export interface ExpressionOrNode {
  readonly kind: 'or';
  readonly children: readonly FilterExpression[];
}

/** Logical NOT: inverts the child node. */
export interface ExpressionNotNode {
  readonly kind: 'not';
  readonly child: FilterExpression;
}

/**
 * Leaf compare: tests a column's cell value against a literal value
 * with the given operator. The 12 supported operators cover the
 * canonical advanced-filter shape (per `audit/TABLE_PHASE_42_
 * ADVANCED_FILTER_DESIGN.md` decision B.1):
 *
 * - 6 binary numeric / equality: `=` / `!=` / `>` / `<` / `>=` / `<=`
 * - 3 string: `contains` / `startsWith` / `endsWith` (case-insensitive
 *   substring; mirrors default; consumers wanting case
 *   sensitivity author the IR directly with a future `caseSensitive`
 *   field — out of scope at v1).
 * - `in` — value is an array of literals; true when the cell value
 *   equals any array entry.
 * - `isNull` / `isNotNull` — null / undefined / missing cell tests
 *   (the compare's `value` is ignored).
 *
 * Cell-value coercion semantics mirror the existing
 * filter-pass behavior — `coerceToText` for the 3 string operators
 * and `coerceToNumber` for the 6 binary operators (the same helpers
 * exported from `filter-pass.ts` are reused inside the evaluator to
 * guarantee parity).
 */
export interface ExpressionCompareNode {
  readonly kind: 'compare';
  readonly colId: string;
  readonly operator: ExpressionOperator;
  readonly value: ExpressionValue;
}

/**
 * Operators accepted by `ExpressionCompareNode.operator`. The string
 * literals match the DSL keywords (case-insensitive at tokenization)
 * for round-trip clarity — `contains` in IR ↔ `CONTAINS` in DSL.
 */
export type ExpressionOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'isNull'
  | 'isNotNull';

/**
 * Scalar literal value at a compare leaf. Restricted to JSON-
 * serializable primitives so the IR round-trips through localStorage /
 * URL state cleanly.
 */
export type ExpressionScalar = string | number | boolean | null;

/**
 * Literal values that can appear in `ExpressionCompareNode.value`.
 * Scalars cover the binary operators + `isNull` / `isNotNull` (where
 * the value is ignored); the flat-array shape is used by the `in`
 * operator (`IN (...)` list). Arrays are intentionally NOT recursive
 * (TS handles a single-level union with a flat array better than a
 * recursive one when this type appears inside Vue's
 * `MaybeRefOrGetter<readonly FilterSpec[]>` chains).
 */
export type ExpressionValue = ExpressionScalar | readonly ExpressionScalar[];
