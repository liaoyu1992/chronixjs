import type { ColumnSpec } from './column-spec.js';

/**
 * IR primitive: tool-panel popover descriptor.
 *
 * chronix-table's `toolPanel` SFC prop accepts a `ToolPanelConfig`
 * with an array of `ToolPanelDescriptor` entries. When `show: true`,
 * a settings (gear) icon is rendered in the action column header;
 * clicking it opens a floating popover that hosts the configured
 * panels.
 *
 * The popover ships only the chrome (horizontal panel tab bar +
 * active-panel content area). The actual panel content is supplied
 * by the consumer via each descriptor's `renderer` callback — chronix
 * invokes the callback in the SFC's reactive graph and embeds the
 * returned VNode (vue3 / vue2) or ReactNode (react) into the content
 * area.
 *
 * Pre-built `<ChronixColumnsToolPanel>` + `<ChronixFiltersToolPanel>`
 * components; consumers can either drop those into a renderer or
 * supply fully-custom panel components.
 */

/**
 * Top-level configuration for the tool-panel popover. Passed as the
 * `toolPanel` SFC prop. `show: false` (or omitting the entire prop)
 * is the identity case — no settings icon, no popover.
 */
export interface ToolPanelConfig {
  /** Master switch. When `false` (or omitted), the settings icon + popover are hidden entirely. */
  readonly show: boolean;

  /**
   * Which panel (by descriptor `id`) is active when the popover first
   * opens. `null` or omitted means the first panel in `panels` is
   * active. When set to an id that does NOT exist in `panels`, falls
   * back to the first panel.
   */
  readonly initialOpenId?: string | null;

  /**
   * Pixel width of the popover content area. Defaults to `320`.
   * Clamped to `[200, 600]` internally.
   */
  readonly popoverWidth?: number;

  /**
   * Max pixel height of the popover content area before scrolling.
   * Defaults to `400`.
   */
  readonly popoverMaxHeight?: number;

  /**
   * Ordered array of tool-panel descriptors. The popover tab bar
   * renders one tab per descriptor in this order. Empty array is
   * treated identically to `show: false`.
   */
  readonly panels: readonly ToolPanelDescriptor[];
}

/**
 * Descriptor for a single tool panel hosted by the popover. The
 * `id` is the stable key chronix uses to identify the panel in
 * emits + TableHandle methods; `label` is the display name in the
 * tab's `aria-label` (or `ariaLabel` if explicitly set);
 * `icon` is the icon string rendered in the tab button;
 * `renderer` is the consumer-supplied callback whose return value
 * is embedded into the content area when this panel is active.
 */
export interface ToolPanelDescriptor {
  /**
   * Stable identifier. Required. Used as the key for active-panel
   * state + emits + TableHandle methods. Must be unique within the
   * same `ToolPanelConfig.panels` array.
   */
  readonly id: string;

  /**
   * Display label for the panel. Used as the tab button's
   * `aria-label` (unless `ariaLabel` is set) + as a fallback tooltip.
   */
  readonly label: string;

  /**
   * Optional icon string rendered as the tab button's content.
   * Accepts any string — emoji (`'☷'`), icon-font character, or
   * SVG-as-text. Defaults to `undefined` (no icon — the tab
   * shows the `label`'s first character as a fallback).
   */
  readonly icon?: string;

  /**
   * Explicit `aria-label` override. Defaults to `label`.
   */
  readonly ariaLabel?: string;

  /**
   * Consumer-supplied content renderer. Invoked when the panel is
   * active; the return value is embedded into the popover content
   * area. Framework-divergent — adapters narrow the return type:
   *
   * - vue3: `() => VNode`
   * - vue2: `() => VNode`
   * - react: `() => ReactNode`
   *
   * The core IR type is `() => unknown` so each adapter can re-declare
   * the concrete return type at its public surface without forcing
   * the core to know about per-framework VNode shapes.
   *
   * The renderer is invoked in the SFC's reactive graph — consumers
   * can close over reactive state (vue refs / react useState) inside
   * the callback and chronix re-invokes the renderer when those
   * deps change.
   */
  readonly renderer: ToolPanelRenderer;
}

/**
 * Tool-panel content renderer. Returns framework-specific VNode /
 * ReactNode. Core uses `unknown`; adapter types narrow per framework.
 */
export type ToolPanelRenderer = () => unknown;

/**
 * Emit payload for `tool-panel-change` — fires whenever the active
 * panel id changes (tab click, programmatic openToolPanel /
 * closeToolPanel, or initialOpenId-driven mount).
 */
export interface ToolPanelChangePayload {
  /** New active panel id; `null` when the popover is closed. */
  readonly activePanelId: string | null;
}

/**
 * Default pixel width of the popover content area when
 * `ToolPanelConfig.popoverWidth` is omitted.
 */
export const DEFAULT_TOOL_PANEL_POPOVER_WIDTH_PX = 320;

/**
 * Default max pixel height of the popover content area when
 * `ToolPanelConfig.popoverMaxHeight` is omitted.
 */
export const DEFAULT_TOOL_PANEL_POPOVER_MAX_HEIGHT_PX = 400;

/**
 * Stable id of the synthetic settings column that the adapter
 * injects (pinned right, `actions: []`) when `ToolPanelConfig.show`
 * is true + non-empty `panels` AND the consumer's `columns` prop
 * contains NO column with an `actions` field. The settings (gear)
 * icon lives in this column's header cell. The column is internal -
 * it never leaks into `columns-change` emits, xlsx export, or
 * saved-table-view serialization (all of those operate on the raw
 * `props.columns`, not the adapter-internal effective column list).
 */
export const SETTINGS_COLUMN_ID = '__cx_settings__';

/**
 * Frozen `ColumnSpec` for the synthetic settings column. `actions:
 * []` (empty) marks it as an actions column so existing actions-
 * column special-casing (no sort, no reorder, no header menu, empty
 * body cell) applies automatically. Consumers should never need to
 * reference this directly.
 */
export const SETTINGS_COLUMN_SPEC: Readonly<ColumnSpec> = {
  id: SETTINGS_COLUMN_ID,
  headerName: '',
  width: 32,
  minWidth: 32,
  pinned: 'right',
  actions: [],
  sortable: false,
  filterable: false,
  reorderable: false,
  resizable: false,
  autosizeable: false,
};
