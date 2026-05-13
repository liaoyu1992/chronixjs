import type { AxisSpec } from './axis-spec.js';
import type { BarSpec } from './bar-spec.js';
import type { LinkSpec } from './link-spec.js';
import type { Viewport } from './primitives.js';
import type { RowSpec } from './row-spec.js';

/**
 * The root IR assembly. Pure data; no methods. A `ChartIR` is the input to
 * every layout pass and is itself derived from `data/` collections plus a
 * `Viewport` snapshot.
 */
export interface ChartIR {
  readonly axes: readonly AxisSpec[];
  readonly rows: readonly RowSpec[];
  readonly bars: readonly BarSpec[];
  readonly links: readonly LinkSpec[];
  readonly viewport: Viewport;
}
