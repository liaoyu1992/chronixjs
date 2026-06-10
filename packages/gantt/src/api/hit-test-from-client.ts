import { defaultStripResolver } from '../interaction/swimlane-strip-at-y.js';
import { xToTime } from '../layout/x-to-time.js';

import type { PlannedAxis, SwimlaneStrip } from '../layout/types.js';

/**
 * Phase 56 — hit-test primitive for external-drag closure. Takes
 * client-space (page) coordinates and the chart pane's geometry
 * snapshot, returns the calendar `time` + target `rowId` if the
 * point falls inside the chart body's content area + a known row
 * strip; otherwise `null`.
 *
 * Pure, stateless — accepts every input as a parameter rather than
 * pulling from a cached context. The chart pane's bounding rect +
 * scroll offsets are point-in-time values that the adapter resolves
 * at call time (`bodySvgRef.value?.getBoundingClientRect()` etc.).
 *
 * **Use case**: external drag-and-drop. A consumer wires their
 * external draggable element via HTML5 DnD / react-dnd / native
 * pointer events; on drag-end they call this helper (via the
 * `GanttHandle.hitTestFromClient` adapter method) to compute the
 * drop's (time, rowId) for new-bar creation.
 *
 * **Out-of-bounds**: returns `null` when the client point falls
 * left/above the chart body, when no swimlane strip owns the y, or
 * when the axis is empty. The caller distinguishes "drag ended
 * outside the calendar" from "drag ended on an inter-strip gap"
 * by checking whether the prior pointer position WAS in-bounds.
 *
 * **Coordinate-transform**: `contentX = clientX − bodyRect.left +
 * scrollLeft` (and analogously for y). The chart pane is the source
 * of truth for "content origin" — scroll offsets shift the content
 * origin relative to client coordinates, so the helper undoes both
 * transforms in one step.
 */

export interface HitTestFromClientInput {
  /** Page-space x coordinate (e.g., from `PointerEvent.clientX`). */
  readonly clientX: number;
  /** Page-space y coordinate (e.g., from `PointerEvent.clientY`). */
  readonly clientY: number;
  /** Bounding rect of the chart body SVG (e.g., from `bodySvgRef.value.getBoundingClientRect()`). */
  readonly bodyRect: { readonly left: number; readonly top: number };
  /** Current horizontal scroll offset of the chart pane (px). */
  readonly scrollLeft: number;
  /** Current vertical scroll offset of the chart pane (px). */
  readonly scrollTop: number;
  /** Current planned axis (axis ticks + slot geometry). */
  readonly axis: PlannedAxis;
  /** Current row swimlane strips. */
  readonly strips: readonly SwimlaneStrip[];
}

export interface HitTestFromClientResult {
  /** Calendar time at the hit position. */
  readonly time: Date;
  /** Row id at the hit position. */
  readonly rowId: string;
}

export function hitTestFromClient(input: HitTestFromClientInput): HitTestFromClientResult | null {
  const contentX = input.clientX - input.bodyRect.left + input.scrollLeft;
  const contentY = input.clientY - input.bodyRect.top + input.scrollTop;
  // Reject points left/above the chart body — these are "outside the
  // drop zone" rather than "in an inter-strip gap" and the caller
  // distinguishes them via the null return.
  if (contentX < 0 || contentY < 0) return null;
  const rowId = defaultStripResolver.atY(contentY, input.strips);
  if (rowId === null) return null;
  const time = xToTime(contentX, input.axis);
  // xToTime returns `new Date(NaN)` when the axis has no ticks. Surface
  // that as `null` so the caller doesn't propagate a NaN-date downstream.
  if (Number.isNaN(time.getTime())) return null;
  return { time, rowId };
}
