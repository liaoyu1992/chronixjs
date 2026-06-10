/**
 * chronix-table theme tokens.
 *
 * The theme is a flat record of geometry + style defaults consumed
 * by layout passes + render helpers + adapters. Consumers pass a
 * `Partial<ChronixTableTheme>` at adapter mount time; the adapter
 * spreads it over `defaultChronixTableTheme` so undefined fields
 * fall back to defaults.
 *
 * Phase 1 (2026-05-23) ships geometry tokens (column width
 * defaults, header + row height, cell padding).
 * Phase 6 (2026-05-23) extends with 5 color tokens (headerBg /
 * headerBorderColor / rowDividerColor / evenRowBg / oddRowBg) +
 * CSS-var injection via `cssVarsForTheme(theme)`: the adapter
 * writes the theme as `--cx-table-*` custom properties on
 * `.cx-table-wrapper`; example CSS reads via `var(--cx-table-*,
 * fallback)`.
 *
 * Subsequent phases extend the theme with feature-specific tokens
 * (sort-indicator color → Phase ~11, filter popover offset → Phase
 * ~12, selection / hover backgrounds → Phase ~13, edit-cell border
 * → Phase ~26).
 *
 * Mirrors the chronix-gantt theme shape — same flat-record + spread
 * + Partial pattern; the two themes do not share keys (they are
 * sibling concerns).
 */
export interface ChronixTableTheme {
  /**
   * Width used for columns that declare neither `width` nor
   * `flex`. Phase 1 default: `100`.
   */
  readonly defaultColumnWidth: number;

  /**
   * Lower clamp for column widths when a column omits its own
   * `minWidth`. Phase 1 default: `40`.
   */
  readonly defaultMinColumnWidth: number;

  /**
   * Header row height in pixels. Phase 1 default: `32`. Used by
   * Phase 2's adapter to size the header strip. Phase 6 also
   * emits as `--cx-table-header-height` CSS var.
   */
  readonly headerHeight: number;

  /**
   * Body row height in pixels. Phase 1 default: `28`. Used by
   * Phase 3's `rowLayoutPass` as the per-row Y stride. Phase 6
   * also emits as `--cx-table-row-height` CSS var.
   */
  readonly rowHeight: number;

  /**
   * Horizontal padding inside each cell (left + right). Phase 1
   * default: `8`. Used by Phase 2's cell renderer. Phase 6 also
   * emits as `--cx-table-cell-padding-x` CSS var.
   */
  readonly cellPaddingX: number;

  /**
   * Phase 6: header background color. Default `'#f1f3f5'`. Emitted
   * as `--cx-table-header-bg`; example CSS reads via
   * `var(--cx-table-header-bg, ...)`.
   */
  readonly headerBg: string;

  /**
   * Phase 6: header section bottom border color. Default
   * `'#d9dde2'`. Emitted as `--cx-table-header-border-color`.
   */
  readonly headerBorderColor: string;

  /**
   * Phase 6: per-row bottom divider color (painted via box-shadow
   * inset so it doesn't affect row layout box). Default
   * `'#eceff2'`. Emitted as `--cx-table-row-divider-color`.
   */
  readonly rowDividerColor: string;

  /**
   * Phase 6: even-row zebra-stripe background. Default `'#fafbfc'`.
   * Emitted as `--cx-table-even-row-bg`.
   */
  readonly evenRowBg: string;

  /**
   * Phase 6: odd-row zebra-stripe background. Default `'#ffffff'`.
   * Emitted as `--cx-table-odd-row-bg`.
   */
  readonly oddRowBg: string;

  /**
   * Phase 10.1 (2026-05-24): width of the optional selection (checkbox)
   * column rail in pixels. Default `36`. The rail sits OUTSIDE the
   * consumer's column layout — it does not participate in
   * `columnLayoutPass` math. Emitted as
   * `--cx-table-selection-column-width` CSS var; consumers who restyle
   * the checkbox (larger hit target, padding) can read the var to keep
   * the cell width matching.
   */
  readonly selectionColumnWidth: number;

  /**
   * Phase 17 (2026-05-26): box-shadow color painted between the
   * left/right pinned zones and the center scrollable zone. Default
   * `'rgba(15, 23, 42, 0.12)'` (a subtle slate). Emitted as
   * `--cx-table-pinned-shadow-color`; CSS applies it via
   * `box-shadow: 2px 0 4px var(--cx-table-pinned-shadow-color, ...)`
   * on the rightmost left-pinned cell and the mirror selector on the
   * leftmost right-pinned cell.
   */
  readonly pinnedShadowColor: string;

  /**
   * Phase 17 (2026-05-26): background color applied to pinned cells
   * so center cells scrolling past don't bleed through the
   * `position: sticky` overlay. Default `'inherit'` — preserves the
   * existing row-stripe behavior. Consumers can override to e.g.
   * `'#fcfcfd'` for a stronger zone hint or to a translucent value
   * if they want a tint over the zebra-stripe. Emitted as
   * `--cx-table-pinned-zone-bg`.
   */
  readonly pinnedZoneBg: string;

  /**
   * Phase 21 (2026-05-27): background color of the drag-fill handle
   * — the small (8×8 px) square overlay rendered at the bottom-right
   * corner of an active cell-range envelope when
   * `cellRangeSelection === 'enabled'`. Default `'#2563eb'` (primary
   * blue). Emitted as `--cx-table-drag-fill-handle-color`; CSS rules
   * also use this token for the `.cx-table-cell--in-fill-preview`
   * dashed outline that previews the fill extent during a drag.
   */
  readonly dragFillHandleColor: string;

  /**
   * Phase 23 (2026-05-27): height in pixels of the optional group
   * header row rendered ABOVE the existing leaf header row when ANY
   * visible column declares `headerGroup`. When no column declares
   * `headerGroup`, the SFC renders only the existing single header row
   * and this token is unused. Default `28`. Emitted as
   * `--cx-table-header-group-height`.
   */
  readonly headerGroupHeight: number;

  /**
   * Phase 23 (2026-05-27): background color of the group header row
   * cells. Subtly darker than `headerBg` so the multi-row header reads
   * as two distinct strips. Default `'#e8ecf0'`. Emitted as
   * `--cx-table-header-group-bg`.
   */
  readonly headerGroupBg: string;

  /**
   * Phase 24 (2026-05-27): height in pixels of the optional sticky
   * footer aggregate row rendered BELOW the body when `showFooterRow:
   * true`. When the footer is suppressed (default), this token is
   * unused. Default `32`. Emitted as `--cx-table-footer-height`.
   */
  readonly footerHeight: number;

  /**
   * Phase 24 (2026-05-27): background color of the footer row cells.
   * Slightly lighter than `headerBg` so the footer reads as the row
   * beneath the body, not a second header. Default `'#f8f9fa'`.
   * Emitted as `--cx-table-footer-bg`.
   */
  readonly footerBg: string;

  /**
   * Phase 30 (2026-05-28): per-depth indent applied to the tree-column's
   * cell content in pixels. A row at `depth = N` gets
   * `paddingLeft = N * treeIndentPx + chevronGutter`, where
   * `chevronGutter` is the fixed 16px reserved for the chevron / leaf
   * spacer. Default `16` — matches AG-Grid + MUI X-DataGridPremium
   * defaults. Emitted as `--cx-table-tree-indent-px`. Only the
   * `treeColumn`-flagged column reads this; other columns render with
   * no indent regardless of row depth.
   */
  readonly treeIndentPx: number;

  /**
   * Phase 30 (2026-05-28): color of the expand/collapse chevron SVG +
   * the leaf-row spacer's `currentColor`. Default `'#5a6675'` (neutral
   * mid-gray, matches sort-indicator + filter-icon colors). Emitted as
   * `--cx-table-tree-chevron-color`. Consumers can theme to brand
   * accent (e.g., `'#2563eb'`).
   */
  readonly treeChevronColor: string;

  /**
   * Phase 30.1.1 (2026-05-28): color used by CSS theming hooks when a
   * tree-data parent row's checkbox is in the indeterminate state
   * (some-but-not-all descendants selected). Default `'#5a6675'`
   * matches `treeChevronColor` for visual cohesion. Emitted as
   * `--cx-table-row-checkbox-indeterminate-color`. The actual
   * indeterminate appearance is driven by the DOM `input.indeterminate`
   * property + CSS class `cx-table-row-checkbox--indeterminate`;
   * consumers wanting a custom mark style read this var.
   */
  readonly rowCheckboxIndeterminateColor: string;

  /**
   * Phase 31 (2026-05-28): z-index applied to `position: sticky`
   * pinned-row strips (top + bottom regions). Default `2` — matches
   * pinned-column z-index so pinned-cols × pinned-rows intersection
   * cells can lift to z-index 4 (Decision J.1). Emitted as
   * `--cx-table-pinned-row-z-index`. Consumers rarely need to override;
   * the token exists for advanced layering scenarios (e.g., a sticky
   * search bar above the table needs to render OVER pinned rows).
   */
  readonly pinnedRowZIndex: number;

  /**
   * Phase 32 (2026-05-28): delay in milliseconds before a cell-hover
   * tooltip appears. Default `400` — long enough to suppress accidental
   * triggers during pointer transit, short enough to feel responsive.
   * Pointermove between cells resets the timer to a fresh interval.
   * Emitted as `--cx-table-tooltip-delay-ms` (informational; the actual
   * setTimeout value is read from this token at SFC mount time).
   */
  readonly tooltipDelayMs: number;

  /**
   * Phase 32 (2026-05-28): tooltip popover background color. Default
   * `'#2a2f36'` (dark slate). Emitted as `--cx-table-tooltip-bg`;
   * default popover styles read it via
   * `background: var(--cx-table-tooltip-bg, ...)`.
   */
  readonly tooltipBg: string;

  /**
   * Phase 32 (2026-05-28): tooltip popover text color. Default
   * `'#ffffff'`. Emitted as `--cx-table-tooltip-color`; pairs with
   * `tooltipBg` for contrast against the dark default.
   */
  readonly tooltipColor: string;

  /**
   * Phase 33 (2026-05-28): background color of the loading / no-rows
   * overlay rendered over the body region. Default
   * `'rgba(255, 255, 255, 0.85)'` (translucent white) so the body
   * remains faintly visible behind the overlay. Emitted as
   * `--cx-table-overlay-bg`. Consumers using a dark theme typically
   * override to a translucent dark color.
   */
  readonly overlayBg: string;

  /**
   * Phase 34 (2026-05-28): color of the inline spinner SVG rendered in
   * a lazy-loading parent row's chevron position. Default `'#5a6675'`
   * (matches `treeChevronColor`). Emitted as
   * `--cx-table-tree-spinner-color`. Consumers can theme to brand
   * accent (e.g., `'#2563eb'`) for a more visible loading indicator.
   */
  readonly treeSpinnerColor: string;

  /**
   * Phase 34 (2026-05-28): color of the inline ⚠ error icon SVG
   * rendered in a lazy-loading parent row's chevron position when
   * `childrenLoader` rejected. Default `'#dc2626'` (red-600). Emitted
   * as `--cx-table-tree-error-color`. Consumers can override for a
   * softer error tone (e.g., `'#f59e0b'` amber).
   */
  readonly treeErrorColor: string;

  /**
   * Phase 36 (2026-05-28): height in pixels of the optional status
   * bar rendered between the body and the pagination footer when
   * `showStatusBar: true`. Default `28`. Emitted as
   * `--cx-table-status-bar-height`. When `showStatusBar: false`
   * (default), this token is unused.
   */
  readonly statusBarHeight: number;

  /**
   * Phase 36 (2026-05-28): background color of the status bar strip.
   * Default `'#f4f6f8'` — slightly lighter than `footerBg` (`'#f8f9fa'`)
   * so the status strip reads as a distinct sibling beneath the
   * footer. Emitted as `--cx-table-status-bar-bg`. Consumers using
   * dark themes typically override.
   */
  readonly statusBarBg: string;
}

/**
 * Default theme. Consumers can spread + override:
 *
 * ```ts
 * const myTheme = { ...defaultChronixTableTheme, rowHeight: 36 };
 * ```
 */
export const defaultChronixTableTheme: ChronixTableTheme = {
  defaultColumnWidth: 100,
  defaultMinColumnWidth: 40,
  headerHeight: 32,
  rowHeight: 28,
  cellPaddingX: 8,
  headerBg: '#f1f3f5',
  headerBorderColor: '#d9dde2',
  rowDividerColor: '#eceff2',
  evenRowBg: '#fafbfc',
  oddRowBg: '#ffffff',
  selectionColumnWidth: 36,
  pinnedShadowColor: 'rgba(15, 23, 42, 0.12)',
  pinnedZoneBg: 'inherit',
  dragFillHandleColor: '#2563eb',
  headerGroupHeight: 28,
  headerGroupBg: '#e8ecf0',
  footerHeight: 32,
  footerBg: '#f8f9fa',
  treeIndentPx: 16,
  treeChevronColor: '#5a6675',
  rowCheckboxIndeterminateColor: '#5a6675',
  pinnedRowZIndex: 2,
  tooltipDelayMs: 400,
  tooltipBg: '#2a2f36',
  tooltipColor: '#ffffff',
  overlayBg: 'rgba(255, 255, 255, 0.85)',
  treeSpinnerColor: '#5a6675',
  treeErrorColor: '#dc2626',
  statusBarHeight: 28,
  statusBarBg: '#f4f6f8',
};
