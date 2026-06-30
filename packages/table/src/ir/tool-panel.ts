/**
 * IR primitive: tool-panel container descriptor.
 *
 * the chronix-NEW alternative to reference's
 * monolithic sidebar component. chronix-table's `toolPanel` SFC prop
 * accepts a `ToolPanelConfig` with an array of `ToolPanelDescriptor`
 * entries; each descriptor describes one tool panel the consumer
 * wants the container to host.
 *
 * The container ships only the chrome (vertical icon rail + active-
 * panel content area + resizer + collapse/expand). The actual panel
 * content is supplied by the consumer via each descriptor's
 * `renderer` callback — chronix invokes the callback in the SFC's
 * reactive graph and embeds the returned VNode (vue3 / vue2) or
 * ReactNode (react) into the content area.
 *
 * Pre-built `<ChronixColumnsToolPanel>` + `<ChronixFiltersToolPanel>`
 * components land + 82 follow-up phases; consumers can
 * either drop those into a renderer or supply fully-custom panel
 * components in v1.
 */

/**
 * Top-level configuration for the tool-panel container. Passed as the
 * `toolPanel` SFC prop. `show: false` (or omitting the entire prop)
 * is the identity case — the SFC renders no container, no rail, no
 * resizer; the wrapper layout falls back to its pre-Phase-80 shape.
 *
 * .
 */
export interface ToolPanelConfig {
  /** Master switch. When `false` (or omitted), the container is hidden entirely. */
  readonly show: boolean;

  /**
   * Which side of the table body to dock the container. Defaults to
   * `'right'`. Top / bottom docking is out of scope for v1.
   */
  readonly side?: 'left' | 'right';

  /**
   * Which panel (by descriptor `id`) is open at mount. `null` or
   * omitted means the content area is collapsed at mount (only the
   * icon rail is visible). When set to an id that does NOT exist in
   * `panels`, the container falls back to collapsed.
   */
  readonly initialOpenId?: string | null;

  /**
   * Initial pixel width of the container (icon rail + content area
   * combined). Defaults to `250`. Clamped to `[minWidth, maxWidth]`.
   * Consumers persisting the width across mounts (via the
   * `tool-panel-width-change` emit) feed the persisted value here.
   */
  readonly initialWidth?: number;

  /** Lower clamp for drag-resize. Defaults to `180`. */
  readonly minWidth?: number;

  /** Upper clamp for drag-resize. Defaults to `600`. */
  readonly maxWidth?: number;

  /**
   * Ordered array of tool-panel descriptors. The icon rail renders
   * one icon-button per descriptor in this order. Empty array is
   * treated identically to `show: false` (no container renders).
   */
  readonly panels: readonly ToolPanelDescriptor[];
}

/**
 * Descriptor for a single tool panel hosted by the container. The
 * `id` is the stable key chronix uses to identify the panel in
 * emits + TableHandle methods; `label` is the display name in the
 * icon's `aria-label` (or `ariaLabel` if explicitly set);
 * `icon` is the icon string rendered in the icon rail's button;
 * `renderer` is the consumer-supplied callback whose return value
 * is embedded into the content area when this panel is active.
 *
 * .
 */
export interface ToolPanelDescriptor {
  /**
   * Stable identifier. Required. Used as the key for active-panel
   * state + emits + TableHandle methods. Must be unique within the
   * same `ToolPanelConfig.panels` array.
   */
  readonly id: string;

  /**
   * Display label for the panel. Used as the icon button's
   * `aria-label` (unless `ariaLabel` is set) + as a fallback tooltip.
   */
  readonly label: string;

  /**
   * Optional icon string rendered as the icon button's content.
   * Accepts any string — emoji (`'☷'`), icon-font character, or
   * SVG-as-text. Defaults to `undefined` (no icon — the button
   * shows the `label`'s first character as a fallback).
   */
  readonly icon?: string;

  /**
   * Explicit `aria-label` override. Defaults to `label`.
   */
  readonly ariaLabel?: string;

  /**
   * Consumer-supplied content renderer. Invoked when the panel is
   * active; the return value is embedded into the content area.
   * Framework-divergent — adapters narrow the return type:
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
 *
 * .
 */
export type ToolPanelRenderer = () => unknown;

/**
 * Emit payload for `tool-panel-change` — fires whenever the active
 * panel id changes (icon click + open / close / panel switch).
 *
 * .
 */
export interface ToolPanelChangePayload {
  /** New active panel id; `null` when the content area collapsed. */
  readonly activePanelId: string | null;
}

/**
 * Emit payload for `tool-panel-width-change` — fires on pointer-up
 * after a resize drag completes. The width is the new total container
 * width in pixels (icon rail + content area combined), clamped to
 * `[minWidth, maxWidth]`.
 *
 * .
 */
export interface ToolPanelWidthChangePayload {
  /** New container width in pixels (post-clamp). */
  readonly width: number;
}

/**
 * Pixel width of the vertical icon rail. The rail is a constant width
 * — only the content area resizes. Exposed as a constant so adapter
 * code + theme overrides can reference one source of truth.
 *
 * .
 */
export const TOOL_PANEL_ICON_RAIL_WIDTH_PX = 40;

/**
 * Default initial container width when `ToolPanelConfig.initialWidth`
 * is omitted.
 *
 * .
 */
export const DEFAULT_TOOL_PANEL_WIDTH_PX = 250;

/**
 * Default lower clamp for container width when
 * `ToolPanelConfig.minWidth` is omitted. Equals the icon rail width
 * + 140px content area floor.
 *
 * .
 */
export const DEFAULT_TOOL_PANEL_MIN_WIDTH_PX = 180;

/**
 * Default upper clamp for container width when
 * `ToolPanelConfig.maxWidth` is omitted.
 *
 * .
 */
export const DEFAULT_TOOL_PANEL_MAX_WIDTH_PX = 600;
