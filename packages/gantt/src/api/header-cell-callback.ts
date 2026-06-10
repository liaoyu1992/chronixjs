import type { ViewId } from '../layout/types.js';
import type { CellStateMeta } from '../render/cell-state-classes.js';

/**
 * Argument bag passed to `headerCellClassNamesCallback`. Fires per
 * rendered header cell — once for each outer band cell (e.g.
 * month-name cell in a month/season/halfYear/year view), once for
 * each tick-row text label. `bandIndex === 0` is the tick row;
 * `bandIndex >= 1` indexes into the outer `axis.headerRows[]` stack
 * (1 = innermost outer band, growing outwards).
 *
 * `date` + `dayMeta` are populated only when the cell represents a
 * single calendar day — day-resolution tick labels (month / season /
 * halfYear / year views) and the week view's per-day outer cells.
 * Both `undefined` for multi-day band cells (month-name bands
 * spanning many days) and for hourly tick labels in day/week views.
 *
 * `viewId` (Phase 45) carries the current view so consumers can
 * branch on it (e.g. larger label classes in `'year'` view, weekend
 * tinting only in `'week'` view). Always defined — the adapter
 * resolves it from the `axisInput.viewId` at render time.
 */
export interface HeaderCellArg {
  readonly bandIndex: number;
  readonly cellIndex: number;
  readonly date: Date | undefined;
  readonly label: string;
  readonly dayMeta: CellStateMeta | undefined;
  readonly viewId: ViewId;
}

/**
 * Per-header-cell class-names callback. Returns a class string, an
 * array of strings, or `undefined` to add no extra classes. Returned
 * classes append to the cell's primary `<rect>` (outer band) or
 * `<text>` (tick row label) — the element whose
 * `cx-gantt-header-cell` / `cx-gantt-tick-label` selector consumer
 * CSS already targets.
 */
export type HeaderCellClassNamesFunc = (
  arg: HeaderCellArg,
) => string | readonly string[] | undefined;
