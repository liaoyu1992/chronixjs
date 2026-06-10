import type { FilterExpression } from './filter-expression.js';

/**
 * IR primitive: filter specification (Phase 9, 2026-05-24).
 *
 * `FilterSpec` is a discriminated union over the `type` field so
 * downstream phases can extend with `'number' | 'date' | 'custom' |
 * 'set'` variants without breaking existing consumers. Phase 9
 * shipped the `'text'` variant; Phase 9.1 (2026-05-24) adds
 * `'number'`. Phase 42 (2026-05-29) adds `'expression'` — a whole-row
 * boolean tree authored either literally or via the DSL parser.
 *
 * The discriminated-union shape lets `filterPass` accept
 * `readonly FilterSpec[]` (multi-column AND) and switch on `type`
 * for the predicate dispatch.
 */
export type FilterSpec =
  | TextFilterSpec
  | NumberFilterSpec
  | ExpressionFilterSpec
  | SetFilterSpec
  | MultiFilterSpec;

/**
 * Text-filter operators (Phase 9). The four basics that cover
 * 80%+ of real-world text-filter use cases:
 *
 * - `contains` — substring match (most common; default behavior of
 *   "type to filter" inputs).
 * - `equals` — exact-match (whole-cell equality).
 * - `startsWith` — anchored at the cell value's start.
 * - `endsWith` — anchored at the cell value's end.
 *
 * Future Phase 9.x can widen this to `'notContains' | 'notEquals' |
 * 'regex'`, but the four shipped here are the universal baseline.
 */
export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith';

/**
 * Text-filter spec — single text-search criterion against one column.
 *
 * - `type: 'text'` discriminates this variant (mandatory; future
 *   variants will use different `type` values).
 * - `colId` references a `ColumnSpec.id`. When unknown / the column
 *   has `filterable === false`, `filterPass` rejects atomically
 *   (matches Phase 8.1 sortPass rejection semantics).
 * - `operator` picks the predicate; see `TextFilterOperator`.
 * - `value` is the user's search string. Empty (`''`) is treated as
 *   "no filter applied" — the spec is kept in the array (so the
 *   filter input renders) but doesn't exclude any row. This lets
 *   consumers render a per-column filter input row that's permanent
 *   regardless of input content.
 * - `caseSensitive` defaults to `false` (commercial data-grid
 *   convention; consumers typing "alpha" expect to match "Alpha").
 */
export interface TextFilterSpec {
  readonly type: 'text';
  readonly colId: string;
  readonly operator: TextFilterOperator;
  readonly value: string;
  readonly caseSensitive?: boolean;
}

/**
 * Number-filter operators (Phase 9.1, 2026-05-24). Seven canonical
 * numeric comparisons:
 *
 * - `=` — exact equality.
 * - `!=` — exact inequality.
 * - `>` / `<` — half-open exclusive (`x > value`, `x < value`).
 * - `>=` / `<=` — half-open inclusive.
 * - `inRange` — `value <= x <= valueTo` (both endpoints inclusive,
 *   matches Excel's "between" semantics).
 *
 * Future Phase 9.x can widen this set; the seven shipped here are
 * the universal baseline.
 */
export type NumberFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'inRange';

/**
 * Number-filter spec (Phase 9.1).
 *
 * - `type: 'number'` discriminates this variant.
 * - `colId` references a `ColumnSpec.id`. Atomic rejection on unknown
 *   colId or `filterable === false` (matches Phase 9 TextFilterSpec).
 * - `operator` picks the comparison; see `NumberFilterOperator`.
 * - `value` is the threshold / equality target.
 * - `valueTo` is required only when `operator === 'inRange'`; ignored
 *   otherwise. The pair `(value, valueTo)` is the inclusive bound:
 *   `value <= x <= valueTo`.
 *
 * Cell-value coercion: `filterPass` accepts only finite `number`
 * cell values (NaN / Infinity / string / boolean / null → predicate
 * fails → row excluded). String "10" does NOT match `value: 10` —
 * consumers with mixed-type columns should provide a `valueGetter`
 * that returns a number.
 */
export interface NumberFilterSpec {
  readonly type: 'number';
  readonly colId: string;
  readonly operator: NumberFilterOperator;
  readonly value: number;
  readonly valueTo?: number;
}

/**
 * Expression-filter spec (Phase 42, 2026-05-29).
 *
 * - `type: 'expression'` discriminates this variant. Carries a whole-
 *   row boolean AST (`FilterExpression`) authored either literally
 *   or via `parseFilterExpression`. `filterPass` compiles the AST
 *   once into a row predicate via `buildExpressionPredicate` and
 *   then reuses the existing per-row AND walk + tree-aware
 *   recursive behavior.
 * - `expression` is the AST root. The root is allowed to be any
 *   `FilterExpression` node (compare leaf, AND/OR combinator, or
 *   NOT wrapper) — the parser's identity-case `null` is converted
 *   to "no filter" by NOT wrapping it in an `ExpressionFilterSpec`
 *   at all (consumers omit the spec entry when clearing).
 * - `source` (optional) preserves the original DSL text when the
 *   spec was applied via `parseAndSetAdvancedFilter` — lets
 *   `getAdvancedFilter` round-trip the input text without
 *   reformatting it (no `formatFilterExpression` ships v1).
 *
 * Atomic rejection: `filterPass` rejects the entire `filterSpec`
 * array when ANY compare leaf inside `expression` references an
 * unknown `colId` OR a column with `filterable === false`. Matches
 * Phase 9 + 9.1's per-spec atomic rejection semantics.
 */
export interface ExpressionFilterSpec {
  readonly type: 'expression';
  readonly expression: FilterExpression;
  readonly source?: string;
}

/**
 * Set-filter spec (Phase 43, 2026-05-29).
 *
 * Excel-style "checkbox list of unique values" filter — the consumer
 * picks which discrete column values pass through. `filterPass` uses
 * a `Set`-backed predicate so per-row dispatch is O(1) regardless of
 * how many values are selected.
 *
 * - `type: 'set'` discriminates this variant.
 * - `colId` references a `ColumnSpec.id`. Atomic rejection on unknown
 *   colId or `filterable === false` (matches Phase 9 / 9.1 / 42
 *   posture).
 * - `selectedValues` semantics:
 *   - `null` → identity (filter inactive; every row passes).
 *   - `[]` (empty array) → vacuous false (no rows pass).
 *   - `[a, b, ...]` → include rows whose coerced cell value equals
 *     any entry. `null` literal inside the array matches null /
 *     undefined / missing cells (Excel's "(Blanks)" semantic).
 *
 * Cell-value coercion mirrors the existing Phase 9 filter-pass /
 * Phase 43 unique-value collection — `string` / `number` / `boolean`
 * / `null` cells pass through; `bigint` / `Date` coerce to string via
 * the same path; objects / functions / symbols collapse to no-match.
 */
export interface SetFilterSpec {
  readonly type: 'set';
  readonly colId: string;
  readonly selectedValues: readonly (string | number | boolean | null)[] | null;
}

/**
 * Phase 102 (2026-06-01): headless text-filter child variant for the
 * multi-filter container. Identical to `TextFilterSpec` minus the
 * `colId` field — the parent `MultiFilterSpec.colId` is the
 * canonical column source, and repeating it per child invites
 * collision risk.
 */
export interface MultiFilterChildText {
  readonly type: 'text';
  readonly operator: TextFilterOperator;
  readonly value: string;
  readonly caseSensitive?: boolean;
}

/**
 * Phase 102 (2026-06-01): headless number-filter child variant for
 * the multi-filter container. Identical to `NumberFilterSpec` minus
 * `colId`.
 */
export interface MultiFilterChildNumber {
  readonly type: 'number';
  readonly operator: NumberFilterOperator;
  readonly value: number;
  readonly valueTo?: number;
}

/**
 * Phase 116 (2026-06-02): headless set-filter child variant for the
 * multi-filter container. Mirrors `SetFilterSpec`'s `selectedValues`
 * field but drops `colId` (the parent `MultiFilterSpec.colId` is
 * canonical per Phase 102 Decision E.1).
 *
 * Semantics match `SetFilterSpec`:
 * - `selectedValues: null` → identity (slot inactive; multi-filter's
 *   anyActive counter doesn't trip).
 * - `selectedValues: []` → vacuous-false (no rows pass this slot).
 * - `selectedValues: [a, b, ...]` → include rows whose coerced cell
 *   value equals any entry; `null` literal matches blank cells.
 */
export interface MultiFilterChildSet {
  readonly type: 'set';
  readonly selectedValues: readonly (string | number | boolean | null)[] | null;
}

/**
 * Phase 102 + 116: union of supported multi-filter children.
 *
 * - Phase 102 (2026-06-01): text + number variants.
 * - Phase 116 (2026-06-02): set variant lifted (was parked per
 *   Phase 102 Decision F.4). Set-slot renders as a nested
 *   `<details>` inside the multi-filter panel body — native
 *   disclosure widget nesting; no JS height management required.
 */
export type MultiFilterChild = MultiFilterChildText | MultiFilterChildNumber | MultiFilterChildSet;

/**
 * Phase 117 (2026-06-02): nested group inside the multi-filter
 * container. Composes recursively with leaf children to express
 * `(A AND B) OR (C AND D)` patterns without dropping to the Phase
 * 42 expression DSL.
 *
 * Semantics:
 *
 * - `type: 'group'` discriminates this variant from the leaf
 *   variants (`'text' | 'number' | 'set'`).
 * - `mode: 'AND' | 'OR'` combines the group's own children's
 *   predicates.
 * - `filters: readonly MultiFilterEntry[]` is the group's ordered
 *   children, each itself a leaf child OR another nested group.
 *
 * Empty groups (`filters: []`) are identity (group's predicate is
 * null; the parent's `anyActive` counter doesn't trip). Same shape
 * as Phase 102's flat-empty case.
 *
 * Depth cap: chronix logs a one-time `console.warn` when group
 * depth exceeds 3 (Phase 117 Decision B.1). The predicate still
 * builds at any depth.
 */
export interface MultiFilterGroup {
  readonly type: 'group';
  readonly mode: 'AND' | 'OR';
  readonly filters: readonly MultiFilterEntry[];
}

/**
 * Phase 117 (2026-06-02): top-level union of multi-filter
 * `filters[]` element types — leaf children (text/number/set) OR
 * nested groups. Backwards-compatible widening from Phase 102's
 * `MultiFilterChild` element type (every leaf widens trivially).
 */
export type MultiFilterEntry = MultiFilterChild | MultiFilterGroup;

/**
 * Phase 102 (2026-06-01): multi-filter container — N stacked filter
 * widgets against a single column combined via an AND-or-OR mode
 * toggle. Composes the Phase 9 text / Phase 9.1 number predicate
 * helpers without reusing the Phase 42 expression DSL (which would
 * force consumers to author + serialize an AST per stack mutation).
 *
 * Semantics:
 *
 * - `type: 'multi'` discriminates this variant.
 * - `colId` is the canonical column source for ALL children. Atomic
 *   rejection on unknown colId or `filterable === false` (matches
 *   Phase 9 / 9.1 / 42 / 43 posture).
 * - `mode: 'AND' | 'OR'` combines child predicates. Empty `filters`
 *   array OR all-empty-value children → identity (no exclusion);
 *   matches the per-spec "active filter short-circuit" pattern
 *   from Phase 9.
 * - `filters` is an ordered list of headless filter children. Order
 *   matters only for render layout — predicate combination is
 *   commutative in both AND and OR modes.
 *
 * The set-widget child shipped in Phase 116 (2026-06-02) as a
 * nested `<details>` inside the multi-filter panel body — native
 * disclosure widget nesting handles height management without JS
 * (`MultiFilterChildSet` variant joins the union).
 *
 * The Phase 42 expression DSL (`ExpressionFilterSpec`) remains the
 * escape hatch for power users needing cross-column / nested-group
 * filters; multi-filter is intentionally single-column only.
 */
export interface MultiFilterSpec {
  readonly type: 'multi';
  readonly colId: string;
  readonly mode: 'AND' | 'OR';
  readonly filters: readonly MultiFilterEntry[];
}
