/**
 * Phase 26 / Phase 32.6: snap a horizontal grid line's y coordinate
 * to the device pixel grid so a 1-px stroke renders as a single
 * device row at any `devicePixelRatio` (100% / 125% / 150% OS
 * scaling) and any fractional CSS row height.
 *
 * Algorithm: round `y * dpr` to the nearest device pixel, then add
 * half a device pixel so the stroke (which extends 0.5 px above and
 * below the y coordinate) lands on integer device rows. Clamps to
 * `[margin, drawableHeight - margin]` so a line at the body's
 * bottom edge stays inside the SVG bounding box without anti-
 * aliasing.
 *
 * Ported verbatim from the original spec's
 * `GanttView.snapHorizontalGridLineY` — keeps stroke weight
 * identical under any zoom transform when paired with
 * `vector-effect="non-scaling-stroke"`.
 *
 * SSR / pre-mount frame: `window` may be undefined or
 * `window.devicePixelRatio` may be NaN / ≤ 0 (jsdom edge cases).
 * The defensive fallback to `dpr = 1` preserves correct output for
 * those environments.
 *
 * Phase 32.6 relocation note: prior to Phase 32.6, each chronix
 * adapter shipped its own inline copy. All 3 adapters now consume
 * this canonical implementation directly via
 * `@chronixjs/gantt`.
 */
export function snapHorizontalGridLineY(lineY: number, drawableHeight: number): number {
  let y = lineY;
  if (y >= drawableHeight) y = drawableHeight - 1;
  const dpr =
    typeof window !== 'undefined' &&
    typeof window.devicePixelRatio === 'number' &&
    Number.isFinite(window.devicePixelRatio) &&
    window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
  let yCrisp = (Math.round(y * dpr) + 0.5) / dpr;
  const margin = 0.5 / dpr;
  const maxY = drawableHeight - margin;
  if (yCrisp < margin) yCrisp = margin;
  if (yCrisp > maxY) yCrisp = maxY;
  return yCrisp;
}
