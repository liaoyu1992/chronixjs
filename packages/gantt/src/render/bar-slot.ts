import type { ChronixTheme } from '../api/chronix-theme.js';
import type { AnyTransaction } from '../interaction/index.js';
import type { BarSpec } from '../ir/index.js';
import type { PlacedBar } from '../layout/types.js';

/**
 * Args bag passed as `SlotContext.args` when the `'bar'` slot fires.
 * Each placed bar gets one invocation per render pass; the template's
 * return is the framework's VNode shape for the entire bar render
 * (`VNode | VNode[]` in Vue3; `ReactNode` in React, eventually). The
 * default `<rect class="cx-gantt-bar">` is replaced entirely when a
 * template is registered — there's no "merge with default" mode.
 *
 * Geometry fields (`renderX/Y/Width/Height`) reflect LIVE transaction
 * state: e.g. mid-drag they include the deltaX/deltaY shift and the
 * cross-row snap-to-target-strip math . Same numbers the
 * default `<rect>` would use, so a custom renderer can drop them
 * straight into a `<rect>` of its own.
 *
 * `theme` is the adapter's effective merged theme (`{...defaults,
 * ...props.theme}`) — custom renderers should read colors from it
 * rather than hard-coding hex values, so consumer chrome stays
 * color-coordinated with the rest of the chart.
 *
 * `activeTransaction` is the in-flight transaction (or `null` when
 * idle). Useful for renderers that want to react to drag / resize /
 * progress states — e.g. dim the bar mid-drag, or highlight the
 * progress handle during a progress-handle drag.
 */
export interface BarSlotArgs {
  readonly placedBar: PlacedBar;
  readonly sourceBar: BarSpec;
  readonly renderX: number;
  readonly renderY: number;
  readonly renderWidth: number;
  readonly renderHeight: number;
  readonly theme: ChronixTheme;
  readonly activeTransaction: AnyTransaction | null;
  /**
   * Whether this bar's id is in the adapter's `selectedBarIds` prop.
   * addition — custom renderers can react visually (e.g.
   * thicker stroke, glow, accent fill) when a bar is selected. The
   * default `<rect>` path applies `.cx-gantt-bar--selected` class
   * automatically; slot renderers own their visual representation
   * and use this flag to drive their own selected-state styling.
   */
  readonly isSelected: boolean;
  /**
   * resolved background color from the bar-color
   * cascade (theme → component prop → `BarSpec.style` → callback).
   * Custom slot renderers should consume this rather than reading
   * `theme.barBackgroundColor` directly so they pick up per-bar
   * style overrides + callback outputs automatically.
   */
  readonly resolvedBackgroundColor: string;
  /** resolved border color (same cascade). */
  readonly resolvedBorderColor: string;
  /** resolved text color (same cascade). */
  readonly resolvedTextColor: string;
}

/**
 * Slot name chronix's adapter consults for per-bar rendering.
 * Exposed as a constant so consumers don't have to remember the
 * literal string and the adapter can rename it in a future phase
 * without breaking caller code.
 */
export const BAR_SLOT_NAME = 'bar';
