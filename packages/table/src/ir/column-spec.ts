import type { EditValidationError } from './edit-validation-error.js';
import type { RowSpec } from './row-spec.js';
import type { CellComparatorArgs } from './sort-spec.js';
import type { ExportStyle } from '../api/export-style.js';
import type { CellRenderArgs, CellValueArgs } from '../render/cell-args.js';

/**
 * IR primitive: column definition.
 *
 * `ColumnSpec` is the consumer-supplied definition for a single
 * column. Every consumer passes an array of these into chronix-table
 * via the adapter's `columns` prop. Downstream layout passes,
 * filters, sorters, and editors all reference columns by `id`.
 *
 * **Identity contract:** `id` must be stable across renders. Chronix
 * uses it as the canonical key for cached layout state, focused
 * cell references, sort/filter spec entries, and column ordering.
 * Two columns with the same `id` is undefined behavior.
 *
 * **`field` vs `id`:** `field` is the property name used to extract
 * the cell value from a row's `data` record (e.g., `'price'` for
 * `row.data.price`). `id` defaults to `field` if omitted but is
 * always required for chronix's internal addressing. Two columns
 * MAY share a `field` (e.g., two different formatters showing the
 * same source value) as long as their `id`s differ.
 *
 * **Width resolution** (see `columnLayoutPass` for the algorithm):
 *
 * - `width` is explicit pixels. When set, it pins the column's
 *   width (subject to `minWidth` / `maxWidth` clamps).
 * - `flex` is a grow factor distributed across remaining width.
 * - With neither set, the column gets the theme's
 *   `defaultColumnWidth` (treated as explicit).
 *
 * **`hide` semantics:** when `true`, the column is excluded from
 * layout + render but its `id` remains addressable (filter / sort
 * state for hidden columns is preserved).
 *
 * ships the minimum field set needed for
 * `columnLayoutPass` + downstream rendering. Additional
 * fields (`valueFormatter`, `cellRenderer` slot, `tooltipField`,
 * `cellClassRules`, etc.) land per-feature in their owning phases.
 */
export interface ColumnSpec {
  /**
   * Stable identifier. Required. Used as the canonical key for
   * layout state, sort/filter spec, and focused-cell references.
   */
  readonly id: string;

  /**
   * Row-data property name used to extract the cell value. Optional —
   * when omitted, the column has no source field (consumer must
   * supply a `valueGetter`, which lands in a future phase). When
   * `id` is omitted in the consumer's input shape, the adapter
   * may default `id` from `field` at construction time.
   */
  readonly field?: string;

  /** Display name in the header. Defaults to `field` then `id`. */
  readonly headerName?: string;

  /**
   * Explicit pixel width. Takes precedence over `flex`. Subject to
   * `minWidth` / `maxWidth` clamps after layout resolution.
   */
  readonly width?: number;

  /**
   * Minimum width in pixels. Used as a clamp during layout
   * resolution. Defaults to `theme.defaultMinColumnWidth` (= 40)
   * when omitted.
   */
  readonly minWidth?: number;

  /**
   * Maximum width in pixels. Used as a clamp during layout
   * resolution. No default — when omitted, the column can grow
   * unbounded with `flex`.
   */
  readonly maxWidth?: number;

  /**
   * Flex grow factor. Distributed across remaining width after
   * explicit-width columns are subtracted. Ignored when `width`
   * is also set.
   */
  readonly flex?: number;

  /**
   * When `true`, the column is excluded from layout and render.
   * Its `id` remains addressable for sort/filter state preservation.
   */
  readonly hide?: boolean;

  /**
   * Column-type hint (e.g., `'text'`, `'number'`, `'date'`). Used by
   * filter and edit phases to pick default editors/filters. No
   * built-in behavior at purely informational until
   * downstream phases consume it.
   */
  readonly type?: string;

  /** Allow the user to sort by this column. Defaults to `true`. */
  readonly sortable?: boolean;

  /** Allow the user to filter by this column. Defaults to `true`. */
  readonly filterable?: boolean;

  /**
   * opt-in column filter UI shape — `'text'`
   * (default) renders the `<input>` filter row cell
   * (text contains / number prefix syntax dispatched by
   * `ColumnSpec.type`); `'set'` renders an Excel-style checkbox-list
   * dropdown of the column's unique values. Set the column's
   * `filterUi` to `'set'` and the adapter wires a native HTML
   * `<details><summary>` dropdown in the filter row + writes
   * `SetFilterSpec` entries into the internal filter spec when a
   * value toggle fires.
   *
   * Default: `'text'`. Backward-compatible — pre-Phase-43 columns
   * keep their behavior.
   */
  readonly filterUi?: 'text' | 'set' | 'multi';

  /**
   * + per-slot widget
   * type for the multi-filter container. Only honored when
   * `filterUi: 'multi'`. The array length determines the stacked-
   * widget slot count; each entry's literal picks the widget type
   * for that slot. Defaults to `['text', 'text']` when
   * `filterUi: 'multi'` is set without this field.
   *
   * lifted the `'set'` variant — set-slot renders as a
   * nested `<details>` inside the multi-filter panel body (native
   * disclosure widget nesting; no JS height management). Reuses
   * `collectUniqueColumnValues` over `props.rows` for the value
   * source — same as outer `filterUi: 'set'`.
   *
   * Slot count cap: chronix logs a one-time `console.warn` when
   * `multiFilterChildTypes.length > 5` (empirically generous; >5
   * stacked widgets per column hurts the filter-row scan UX).
   *
   * Ignored unless `filterUi === 'multi'`.
   */
  readonly multiFilterChildTypes?: readonly ('text' | 'number' | 'set')[];

  /** Allow the user to edit cells in this column. Defaults to `false`. */
  readonly editable?: boolean;

  /** Allow the user to resize this column's width. Defaults to `true`. */
  readonly resizable?: boolean;

  /**
   * allow the user to drag this column's header
   * cell horizontally to change column order. Defaults to `true`. When
   * `false`, the SFC skips wiring pointer-capture handlers on the
   * column's header cell so a regular header click (sort cycle) is
   * the only interaction available — and the column never appears as
   * a drop target either (the moved-column drag pass over it falls
   * back to the next reorderable column).
   *
   * Mirror of `resizable?: boolean` in shape + semantics — both
   * column-infrastructure affordances are non-destructive, so the
   * default is opt-OUT.
   */
  readonly reorderable?: boolean;

  /**
   * mark this column's body cells as a
   * row-drag grip surface. When `true`, pointer-down on any body
   * cell in this column initiates a row-drag-to-reorder session per
   * the row-drag pipeline. The cell also gets `cursor: grab`
   * styling for affordance discovery. Defaults to `undefined`
   * (false — no grip).
   *
   * Per-cell exclusions still apply: cells whose row has
   * `RowSpec.draggable === false` or `RowSpec.pinned != null` skip
   * the wiring (no grip cursor, no pointer handler).
   *
   * **Mutually exclusive with `rowDragColumn.show: true`**: when both
   * are set, the dedicated sticky-rail `rowDragColumn` wins; this
   * flag is ignored with a one-time `console.warn`. Two grip surfaces
   * in the same render would confuse UX.
   *
   * Promoted 's rejected Decision B.3 — consumers who
   * already have a primary identifier column ("task name") can mark
   * it as the grip surface instead of opting into the sticky rail.
   */
  readonly rowDragHandle?: boolean;

  /**
   * allow the user to double-click the column's
   * resizer to autosize the column to its content; also
   * gates the imperative `autosizeColumn(colId)` /
   * `autosizeAllColumns()` TableHandle methods. Defaults to `true`.
   * When `false`, dbl-click on the resizer is a silent no-op and the
   * handle methods skip this column.
   *
   * Composes with `resizable`: if `resizable: false`, the column has
   * no resizer DOM and so there's no surface to dbl-click; the handle
   * methods also early-out (cannot mutate a non-resizable column's
   * width). The opt-OUT here lets consumers keep `resizable: true`
   * (manual drag works) while disabling the autosize convenience.
   *
   * Mirror of `resizable?` / `reorderable?` in shape — all three
   * column-infrastructure affordances are non-destructive, so the
   * default is opt-OUT.
   */
  readonly autosizeable?: boolean;

  /**
   * Pin the column to the left or right edge. `null` (or omitted)
   * leaves the column in the center scrollable zone.
   * `columnLayoutPass` ignores pinning for width resolution — a
   * later phase's `pinnedColsPass` splits the layout result into
   * left / center / right zones.
   */
  readonly pinned?: 'left' | 'right' | null;

  /**
   * override the default field-based value
   * extraction. When set, runs INSTEAD of `row.data[field ?? id]`.
   *
   * Use cases: derived values (`{row} => row.data.first + ' ' +
   * row.data.last`); cross-column composition; conditional source
   * fields.
   *
   * Synchronous only at; async value resolution lands with
   * the Phase ~82 server-side row model.
   */
  readonly valueGetter?: (args: CellValueArgs) => unknown;

  /**
   * format the resolved value into a display string.
   * Receives `{value, row, column}` (value is the original
   * `valueGetter` output, or default field-based extraction when
   * `valueGetter` is omitted).
   *
   * When omitted, `defaultFormatCellValue` handles common primitive
   * cases (string/number/boolean/bigint/Date pass-through; nullish →
   * '', plain objects → '[object]' placeholder).
   */
  readonly valueFormatter?: (args: CellRenderArgs) => string;

  /**
   * additional CSS class names for this column's body
   * cells. Three shapes accepted:
   *
   * - `string` → static single class.
   * - `readonly string[]` → static multi-class array.
   * - `(args: CellRenderArgs) => string | readonly string[]` →
   *   state-driven; receives `{value, row, column}` and returns
   *   the class(es) to apply for this specific cell.
   *
   * Resolved through `resolveCellClassNames`. The returned classes
   * are ADDITIONS to the structural `cx-table-cell`; the adapter
   * spreads them into the cell's class list.
   *
   * `cellClassRules` (condition-keyed object) is deliberately
   * omitted per Decision C.1 — the function form covers
   * the same expressive power with one fewer concept.
   */
  readonly cellClass?:
    | string
    | readonly string[]
    | ((args: CellRenderArgs) => string | readonly string[]);

  /**
   * per-column override for the sort comparator.
   * When set, runs INSTEAD of `sortPass`'s built-in generic comparator
   * (the one that auto-detects null / Date / number / bigint / boolean
   * / string).
   *
   * Receives the post-`valueGetter` values for the two rows being
   * ordered, plus a `{rowA, rowB, column}` args object for callbacks
   * that need to read sibling fields.
   *
   * Return contract matches the standard `Array.prototype.sort`
   * comparator: negative when `a` should sort before `b`, positive
   * when `a` should sort after, zero for equal. `sortPass` applies the
   * direction sign-flip on top of the comparator's return value, so
   * the comparator itself only needs to encode the ASC ordering.
   *
   * Null-last semantics are NOT applied to custom comparators — if
   * the consumer wants nulls trailing in their custom order, they
   * handle the null branch themselves. The built-in comparator's
   * null-last branch is direction-independent + only fires when no
   * custom `comparator` is set.
   *
   * Use cases: semver / hierarchical path / weighted enum / mixed-type
   * columns where the default fallback would coerce-and-stringify.
   */
  readonly comparator?: (a: unknown, b: unknown, args: CellComparatorArgs) => number;

  /**
   * / opt-in column
   * grouping for the multi-row header. Sibling columns sharing the same
   * `headerGroup` (or a common prefix path, for nested groups) render
   * as a single labelled cell in a header row above the existing leaf
   * header row.
   *
   * **Two shorthand forms:**
   *
   * - `'X'` (string) — single-level group; equivalent to `['X']`.
   *   Preserved verbatim from the baseline so existing column
   *   shapes keep working.
   * - `['X', 'Y']` (readonly string[]) — explicit path from root group
   *   to immediate-parent group. Length N renders N group rows above
   *   the leaf row; level 0 is the topmost; the leaf header row sits
   *   below at its existing height.
   *
   * When ANY visible column declares a non-empty `headerGroup`, the
   * adapter renders N group rows (height = `theme.headerGroupHeight`
   * each) above the existing leaf header row, where N = max
   * `headerGroup` path length across visible columns. Columns whose
   * path is shorter than N produce empty placeholder cells on the
   * uncovered top levels so leaf headers stay vertically aligned.
   * When NO column declares `headerGroup`, the adapter renders only
   * the existing single header row — zero behavior change for
   * existing consumers.
   *
   * **Adjacency required for merging** (per `computeHeaderGroupSpans`):
   * at each level L, two adjacent column cells merge into a span IFF
   * they share the same level-L name AND their parent path `[0..L-1]`
   * is identical. Two non-adjacent columns with the same level-L name
   * render as two separate spans — no automatic column reordering.
   * Two columns sharing level-1 name but different level-0 parents
   * ALSO render as separate spans (path-prefix discriminator).
   *
   * **Zone-aware**: left / center / right pinned zones each
   * compute their own spans independently — a group never spans across
   * a zone boundary, at any level. Two zone-flanking columns sharing
   * the same path also render as two separate spans (one per zone).
   *
   * **Path length limit**: practical limit ~3-4 levels; the adapter
   * does not artificially cap. Deeper paths render proportionally
   * taller header strips (`N * theme.headerGroupHeight`).
   */
  readonly headerGroup?: string | readonly string[];

  /**
   * per-column aggregator for the optional
   * sticky footer row. Receives the post-filter rows (NOT post-page —
   * the footer aggregates ALL filtered rows per Decision A.1) and
   * returns any value (number / string / formatted text — consumer's
   * choice). The adapter then runs the result through this column's
   * `valueFormatter` (if set) just like a body cell, else through the
   * default formatter; consumers who want full control over the
   * displayed text can return a pre-formatted string here and skip
   * `valueFormatter`.
   *
   * Synchronous + pure. Throws are swallowed by `computeFooterValues`;
   * a throwing aggregator renders its footer cell as `null` (the other
   * cells are unaffected) — matches `valueFormatter`'s
   * defensive posture.
   *
   * When this column has no `aggregator`, the adapter renders an empty
   * placeholder footer cell sized to the column's width (Decision C.1)
   * so the footer row stays column-aligned with the body + header.
   *
   * The aggregator is only invoked when the adapter's `showFooterRow`
   * prop is `true`; with the footer suppressed (default), the function
   * is never called and consumers pay nothing.
   */
  readonly aggregator?: (rows: readonly RowSpec[]) => unknown;

  /**
   * plain-text tooltip source field. When set,
   * hovering over a body cell in this column for `theme.tooltipDelayMs`
   * milliseconds (default 400ms) shows a popover with the value of
   * `row.data[tooltipField]` rendered as text via the default formatter.
   *
   * Composes with `tooltipValueGetter`: when both are set, the getter
   * takes precedence (per `resolveCellTooltip`'s cascade). When only
   * `tooltipField` is set, the value is extracted via
   * `row.data[tooltipField]` + run through `defaultFormatCellValue` to
   * coerce to a string. When the resolved value is `null` /
   * `undefined` / empty string, NO popover renders for this cell.
   *
   * Use cases: showing the full text of a truncated column (where
   * `valueFormatter` already shortens for body display) by re-using a
   * sibling `*-full` field; surfacing an `id` or other reference field
   * on hover for power users.
   */
  readonly tooltipField?: string;

  /**
   * override the field-based tooltip resolution
   * with a computed string. When set, takes precedence over
   * `tooltipField` per `resolveCellTooltip`'s cascade. Returns `null` /
   * `undefined` / empty string to suppress the popover for this cell.
   *
   * Synchronous. Receives `{row, column}`; no `value` arg because the
   * tooltip text is logically independent of the cell's body value (a
   * tooltip might display a row-aware computed string regardless of
   * which cell triggered it).
   *
   * Returning a multi-line string is supported — the popover wraps with
   * `white-space: pre-wrap`. Returning HTML is NOT supported in v1; the
   * popover always renders as text.
   */
  readonly tooltipValueGetter?: (args: CellValueArgs) => string | null | undefined;

  /**
   * mark this column as the tree column. Exactly
   * one visible column should be flagged when the consumer's row data
   * carries `children` (tree data). The flagged column renders
   * the expand/collapse chevron + depth-driven indent in its body cells;
   * other columns render content unchanged.
   *
   * When zero columns are flagged but row data has `children`, the
   * adapter falls back to the first visible column with a `console.warn`
   * suggesting an explicit opt-in. When multiple columns are flagged,
   * only the first visible (in display order) is treated as the tree
   * column; later flagged columns warn + render as plain columns.
   *
   * Defaults to `false` — non-tree datasets and flat tables pay zero
   * cost for this field.
   */
  readonly treeColumn?: boolean;

  /**
   * per-column body-cell style applied to the
   * xlsx export. Header row preserves the Decision C.1 bold-
   * row default; this field affects only body cells. Column-uniform
   * scope (every body cell in the column gets the same style); per-
   * row × per-column callback is deferred to a future sub-phase.
   *
   * The `ExportStyle` shape is a thin chronix-curated subset of
   * exceljs's `Cell.style`; `mapExportStyleToExcelJs` (module-internal
   * to `export-style.ts`) translates between them at export time.
   *
   * Defaults to `undefined` (no styling — Excel's default cell style
   * applies). When `exportStyle` is set, downstream `exportToXlsx`
   * applies it via exceljs's per-cell `cell.style` setter.
   */
  readonly exportStyle?: ExportStyle;

  /**
   * -A (2026-05-30): opt-in row-number column. When `true`,
   * the body cell renders the row's displayed-position index (1-based,
   * post-filter / post-sort / post-page) as its text content + skips
   * the `valueGetter` / `valueFormatter` / `cellRenderer` pipeline.
   * Sorting + filtering on this column are unconditionally disabled
   * (a row-number value depends on display order — sorting or
   * filtering by it is semantically nonsensical).
   *
   * Composes with every existing column affordance: pin via `pinned:
   * 'left' | 'right'`; width via `width` / `minWidth` / `maxWidth`;
   * hide via `hide: true`; resize via `resizable`; reorder via
   * `reorderable`. Multiple `rowNumber: true` columns are allowed
   * (e.g. one `1, 2, 3...` + one `001, 002, 003...` via a
   * `valueFormatter`) — though only the first column's cell value is
   * the raw number; subsequent rowNumber columns receive the SAME
   * displayed index.
   *
   * Defaults to `false` — flat datasets pay zero cost for this field.
   */
  readonly rowNumber?: boolean;

  /**
   * -B (2026-05-30): opt-in per-row action buttons. When set
   * with a non-empty array, the body cell renders one `<button>` per
   * `RowAction` descriptor in a horizontal flex strip. Each button's
   * content is the action's `icon` (when set) + `label` (suppressed
   * when `iconOnly: true`). `disabled?(row)` is called per render +
   * sets the button's `disabled` attribute. `onClick(row)` fires on
   * click with `event.stopPropagation()` applied so cell-click / row-
   * click bubbling is suppressed.
   *
   * When `actions != null && actions.length > 0`, the body cell
   * IGNORES `valueGetter` / `valueFormatter` / `cellRenderer` — the
   * actions strip is the cell's content. `cellClass` / pinned-zone /
   * tooltip / quick-find still apply (per existing cascade).
   *
   * Defaults to `undefined` — non-action columns pay zero cost for
   * this field.
   */
  readonly actions?: readonly RowAction[];

  /**
   * -C (2026-05-30): opt-in wrap-text for multi-line cell
   * content. When `true`, the body cell's text container gets `white-
   * space: pre-wrap; word-break: break-word` so multi-line strings +
   * long unwrapped strings wrap inside the cell width. Composes with
   * `enableRowAutoHeight` SFC prop — when both are enabled, the
   * SFC's ResizeObserver measures the wrapped content's natural
   * height + the row grows to fit.
   *
   * Defaults to `false` — non-wrapping cells pay zero cost.
   */
  readonly wrapText?: boolean;

  /**
   * per-column edit-commit validator. Called
   * by `applyEditCommit` AFTER `coerceEditDraftValue` produces a
   * typed value but BEFORE the `cell-value-change` emit. Receives
   * the post-coerce value + the row being edited.
   *
   * Return contract (`runCellValidator` normalises all three shapes):
   *
   * - `null` (or no return) → cell value is valid; commit proceeds
   *   normally; any prior invalid-cell marker on this cell is
   *   cleared.
   * - `string` → shorthand for `{ reason: <string> }`. Commit is
   *   rejected; the editor stays open; cell paints the
   *   `cx-table-cell--invalid` class + `data-cell-invalid="true"` +
   *   `aria-invalid="true"`; `cell-edit-stop` emits with
   *   `committed: false` + `validationError: { reason }`.
   * - `EditValidationError` object → full structured rejection.
   *   Same effect as the string shorthand but with the optional
   *   `code` propagated through to the consumer for i18n /
   *   error-class branching.
   *
   * **Sync only at v1.** Async validation introduces request-id
   * race-discard machinery and is parked per design Decision B.2.
   * Consumers needing async validation should run it AFTER receiving
   * `cell-edit-stop {committed: true}` and call back into chronix
   * imperatively if they need to mark the cell invalid.
   *
   * **Throwing is NOT caught.** A throwing validator surfaces to the
   * consumer's error boundary — matching the `aggregator`
   * defensive posture is intentionally NOT applied here (validators
   * are a business-logic surface, not a defensive one; a thrown
   * exception during commit should fail loudly).
   *
   * **Execution order is locked** (Decision E.1):
   * `coerceEditDraftValue` → `validator(coercedValue, row)` →
   * outcome dispatch. When coerce rejects, `validator` is NOT called
   * — consumers don't need to repeat coerce-style guards inside
   * their validator function.
   *
   * Defaults to `undefined` (no validator). Backwards-compatible —
   * pre-Phase-101 columns commit unconditionally after coerce
   * succeeds.
   */
  readonly validator?: (value: unknown, row: RowSpec) => string | EditValidationError | null;

  /**
   * per-column async edit-commit validator.
   * Runs AFTER the sync `validator` (when present) has accepted the
   * value, and ONLY when both original gates (`coerceEditDraftValue`
   * + sync `validator`) pass. Receives the post-coerce typed value +
   * the row being edited; resolves to the same three shapes as the
   * sync `validator`.
   *
   * Locked execution order (Decision B.1):
   * `coerceEditDraftValue` → `validator` (sync) → `validatorAsync`
   * (async) → outcome dispatch. Any earlier rejection
   * short-circuits — async never runs against guaranteed-invalid
   * values.
   *
   * **Pending state surface** while the promise is in flight:
   * - The editor stays open (`getEditingCell()` keeps returning the
   *   cell). User can re-edit the draft; typing creates a new
   *   commit attempt, which discards the prior pending async via
   *   request-id race-token.
   * - Cell paints `cx-table-cell--validating` class +
   *   `data-cell-validating="true"` data-attr + `aria-busy="true"`
   *   ARIA attr.
   * - A `cell-edit-validation-pending` SFC emit fires when async
   *   starts; the existing `cell-edit-stop` emit fires on final
   *   resolve (success or rejection), matching
   *   "stop = stable outcome" contract.
   *
   * **Promise rejection** (per Decision E.1): synthesized
   * as `EditValidationError { reason: error.message ?? String(error),
   * code: 'async-error' }`. Original error chain is preserved via
   * `console.error` so consumer devtools / error-reporters still
   * see it.
   *
   * Defaults to `undefined`. Backwards-compatible — pre-Phase-111
   * columns commit unconditionally after sync `validator` succeeds.
   */
  readonly validatorAsync?: (
    value: unknown,
    row: RowSpec,
  ) => Promise<string | EditValidationError | null>;
}

/**
 * -B (2026-05-30): descriptor for a single per-row action
 * button rendered inside an actions column (`ColumnSpec.actions`
 * non-empty array). The chronix-table SFC renders one `<button
 * class="cx-table-cell-action" data-action-id="${id}">` per
 * descriptor + dispatches `onClick(row)` on click.
 *
 * The structured descriptor handles 95% of consumer requests
 * (predefined action set with icons + labels) without forcing every
 * consumer to hand-roll button rendering + accessibility wiring. The
 * existing `cellRenderer` slot remains for the 5% fully-custom case
 * (e.g. dropdown menus, multi-state toggles, async confirm dialogs).
 */
export interface RowAction {
  /**
   * Stable identifier for this action. Used as the React key + as a
   * stable test selector via the rendered cell's `data-action-id`
   * attribute. Must be unique within the same `ColumnSpec.actions`
   * array.
   */
  readonly id: string;

  /**
   * Display label for the button. When `iconOnly: true`, the label
   * is suppressed visually but still used as the button's
   * `aria-label` (unless `ariaLabel` is explicitly set).
   */
  readonly label: string;

  /**
   * Optional icon string. Rendered as the button's leading span via
   * `<span class="cx-table-cell-action-icon">{icon}</span>`. Accepts
   * any string — emoji (`'✏️'`), icon-font character, or SVG-as-text.
   * Defaults to `undefined` (no icon).
   */
  readonly icon?: string;

  /**
   * When `true`, the button renders the icon only (no visible label
   * text); the `label` is still used for the button's `aria-label`
   * for screen-reader support. Defaults to `false`.
   */
  readonly iconOnly?: boolean;

  /**
   * Per-row disabled predicate. Called per render with the row spec;
   * returning `true` sets the button's `disabled` attribute + adds the
   * `cx-table-cell-action--disabled` modifier class. Defaults to
   * `undefined` (button always enabled). Throws are NOT caught — a
   * throwing predicate breaks the render and surfaces to the
   * consumer's error boundary.
   */
  readonly disabled?: (row: RowSpec) => boolean;

  /**
   * Click handler. Fires when the user clicks the button. The SFC
   * applies `event.stopPropagation()` before calling the handler so
   * cell-click / row-click bubbling is suppressed. Synchronous; long-
   * running work should be dispatched via the consumer's own
   * Promise / setTimeout.
   */
  readonly onClick: (row: RowSpec) => void;

  /**
   * Explicit `aria-label` override. When set, takes precedence over
   * `label` for the button's accessible name. Defaults to `undefined`
   * (button uses `label` as accessible name).
   */
  readonly ariaLabel?: string;
}
