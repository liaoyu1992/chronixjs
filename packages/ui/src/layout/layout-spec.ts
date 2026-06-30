/**
 * Layout component IR — . Tier B layout shell.
 * Ships the props for `ChronixLayout` and its 4 sub-components
 * (`ChronixLayoutHeader` / `ChronixLayoutSider` /
 * `ChronixLayoutContent` / `ChronixLayoutFooter`) + a pure helper
 * for resolving sider width from the `collapsed` state.
 *
 * Sub-components are self-contained — no parent context coordination
 * (per design F1.D). `ChronixLayout` introspects its slot /
 * children at adapter scope to determine `hasSider`.
 *
 * Out-of-scope (v0.2):
 * - Custom sider trigger icon.
 * - Fixed sider positioning variants.
 * - Nested Layout.
 * - RTL support.
 */

export interface LayoutProps {
  /**
   * Whether the layout contains a sider. Adapter typically auto-detects
   * by introspecting children; consumer may force explicitly via this
   * prop. Drives the `--has-sider` modifier (changes flex-direction).
   */
  readonly hasSider: boolean;
  /**
   * Outer position mode. `'static'` (default) — layout flows in the
   * document. `'absolute'` — `position: absolute; inset: 0` so the
   * layout fills its containing positioned ancestor.
   */
  readonly position: 'static' | 'absolute';
}

export const defaultLayoutProps: LayoutProps = {
  hasSider: false,
  position: 'static',
};

/**
 * Sider edge — drives the `--placement-left` / `--placement-right`
 * modifier. The trigger button + sider order in the flex container
 * differ between the two.
 */
export type LayoutSiderPlacement = 'left' | 'right';

/**
 * Breakpoint preset names + their pixel boundaries. Adapter sets up a
 * `window.matchMedia('(max-width: ${px - 1}px)')` listener when
 * `breakpoint` is defined; auto-collapses on match.
 *
 * Values mirror the common SPA tier (Bootstrap / Ant). Consumers
 * wanting custom px values can substitute
 * `componentOverrides` field once that surface is opened (deferred).
 */
export type LayoutSiderBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const LAYOUT_SIDER_BREAKPOINT_PX: Readonly<Record<LayoutSiderBreakpoint, number>> = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1600,
};

export interface LayoutSiderProps {
  /** Expanded width — number → `${n}px`, string → applied as-is. */
  readonly width: number | string;
  /** Collapsed width — number → `${n}px`, string → applied as-is. */
  readonly collapsedWidth: number | string;
  /** Controlled collapsed state. */
  readonly collapsed: boolean;
  /** Whether to render the chevron trigger button at the inner edge. */
  readonly collapsible: boolean;
  /** Edge the sider pins to. */
  readonly placement: LayoutSiderPlacement;
  /**
   * When defined, the sider auto-collapses below the breakpoint
   * threshold (via `window.matchMedia`). Adapter emits
   * `update:collapsed(true)` when the query matches; `(false)` when it
   * unmatches. Undefined = no auto-collapse.
   */
  readonly breakpoint: LayoutSiderBreakpoint | undefined;
}

export const defaultLayoutSiderProps: LayoutSiderProps = {
  width: 200,
  collapsedWidth: 48,
  collapsed: false,
  collapsible: false,
  placement: 'left',
  breakpoint: undefined,
};

/**
 * Resolve the inline `width` style for the sider based on `collapsed`
 * state. Pure helper consumed by all 3 adapters.
 */
export function resolveLayoutSiderWidthStyle(input: {
  readonly collapsed: boolean;
  readonly width: number | string;
  readonly collapsedWidth: number | string;
}): string {
  const value = input.collapsed ? input.collapsedWidth : input.width;
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Resolve the `matchMedia` query string for a breakpoint preset.
 * Convention: query matches when the viewport is BELOW the named
 * breakpoint (i.e. `max-width: ${px - 1}px`).
 */
export function resolveBreakpointMediaQuery(breakpoint: LayoutSiderBreakpoint): string {
  const px = LAYOUT_SIDER_BREAKPOINT_PX[breakpoint];
  return `(max-width: ${px - 1}px)`;
}
