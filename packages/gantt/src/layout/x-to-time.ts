import type { PlannedAxis } from './types.js';

/**
 * Phase 54 — maps an x position (in chart content-coord space, i.e.
 * `0` = first axis tick, `axis.totalWidth` = last tick + 1 slot) to a
 * `Date` using the axis's nominal `pxPerMs = slotWidth / slotDurationMs`
 * conversion rate.
 *
 * Used by adapter pointerup handlers to surface the calendar time at
 * an empty-area click position, so consumers can implement "create
 * new event at click" UX without re-implementing the x→time math.
 *
 * **Approximation**: `slotDurationMs` is nominal — DST transitions +
 * other irregularities mean the real tick-to-tick delta varies. The
 * returned Date is correct to within ~1 hour during DST transitions.
 * Matches the original `dateClick(DatePointApi)` mapping,
 * which uses the same approximation.
 *
 * **Out-of-range x**: when `x < 0`, returns a Date before the first
 * tick; when `x > axis.totalWidth`, returns a Date after the last
 * tick + 1 slot. Caller is responsible for clamping if a bounded
 * range is needed.
 *
 * **Empty axis**: when `axis.ticks.length === 0`, returns
 * `new Date(NaN)` — signals "no axis" rather than throwing so the
 * adapter pointerup handler can fall through to a degenerate
 * payload without breaking the emit chain.
 */
export function xToTime(x: number, axis: PlannedAxis): Date {
  if (axis.ticks.length === 0) return new Date(NaN);
  const firstTickMs = axis.ticks[0]!.time.getTime();
  const pxPerMs = axis.slotWidth / axis.slotDurationMs;
  return new Date(firstTickMs + x / pxPerMs);
}
