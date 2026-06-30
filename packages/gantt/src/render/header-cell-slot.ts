import type { CellStateMeta } from './cell-state-classes.js';
import type { ChronixTheme } from '../api/chronix-theme.js';
import type { AxisHeaderCell, AxisTick } from '../layout/types.js';

/**
 * Args bag passed as `SlotContext.args` when the `'header-cell'` slot
 * fires (chronix-additive parallel 's `'bar'`
 * slot and `'link'` slot). Each rendered header cell
 * gets one invocation per render pass; the template's return is the
 * framework's VNode shape for the cell's entire output. The default
 * `<rect>+<text>` pair is replaced entirely when a template is
 * registered.
 *
 * `bandIndex` lets the consumer render differently per stack-row:
 * `0` is the innermost tick row (per-tick labels), `1+` are outer
 * header bands (month / week / etc. group cells stacked above).
 *
 * `date` is populated when the cell corresponds to a single day — the
 * tick row's per-tick labels in day-resolution views (month / season /
 * halfYear / year), plus the per-day cells of the week view's outer
 * band. It is `undefined` for multi-day band cells (month-name bands
 * spanning many days). `dayMeta` follows the same shape: present when
 * `date` is present, undefined otherwise.
 *
 * `cell` is the underlying `AxisHeaderCell` when rendering an outer
 * band cell; `tick` is the underlying `AxisTick` when rendering a
 * tick-row label. Exactly one is defined per invocation.
 *
 * `extraClasses` carries class names returned by
 * `headerCellClassNamesCallback` (when the consumer also wired the
 * callback prop). Slot templates that want to honor the callback's
 * output spread them into their own root element's class list.
 *
 * `theme` is the adapter's effective merged theme. Slot consumers
 * read header colors / font sizes from it so visual choices stay
 * coordinated with the rest of the chart chrome.
 */
export interface HeaderCellSlotArgs {
  readonly bandIndex: number;
  readonly cellIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly date: Date | undefined;
  readonly dayMeta: CellStateMeta | undefined;
  readonly theme: ChronixTheme;
  readonly cell?: AxisHeaderCell;
  readonly tick?: AxisTick;
  readonly extraClasses?: readonly string[];
}

/**
 * Slot name chronix's adapter consults for per-header-cell rendering.
 * Exposed as a constant so consumers don't have to remember the
 * literal string and the adapter can rename it in a future phase
 * without breaking caller code. Parallel to `BAR_SLOT_NAME`
 * and `LINK_SLOT_NAME` .
 */
export const HEADER_CELL_SLOT_NAME = 'header-cell';
