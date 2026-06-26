/**
 * Snap a vertical grid line's x coordinate to the device pixel grid so
 * a 1-px stroke renders as a single device column at any
 * `devicePixelRatio` (100% / 125% / 150% OS scaling) and any fractional
 * CSS slot width.
 *
 * Algorithm: round `x * dpr` to the nearest device pixel, then add half
 * a device pixel so the stroke (which extends 0.5 px left and right of
 * the x coordinate) lands on integer device columns. Clamps to
 * `[margin, drawableWidth - margin]` so a line at the body's right edge
 * stays inside the SVG bounding box without anti-aliasing.
 *
 * Vertical twin of `snapHorizontalGridLineY` — same algorithm, X axis.
 * Exists so the header tick lines and the body grid vlines can share one
 * canonical X coordinate (both rendered as `<line>` +
 * `vector-effect="non-scaling-stroke"`), which makes them pixel-identical
 * by construction instead of drifting by 0.5 px between a centered header
 * stroke and an integer-aligned body `<rect>`.
 *
 * SSR / pre-mount frame: `window` may be undefined or
 * `window.devicePixelRatio` may be NaN / ≤ 0 (jsdom edge cases). The
 * defensive fallback to `dpr = 1` preserves correct output for those
 * environments.
 */
export function snapVerticalGridLineX(lineX: number, drawableWidth: number): number {
  let x = lineX;
  if (x >= drawableWidth) x = drawableWidth - 1;
  const dpr =
    typeof window !== 'undefined' &&
    typeof window.devicePixelRatio === 'number' &&
    Number.isFinite(window.devicePixelRatio) &&
    window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
  let xCrisp = (Math.round(x * dpr) + 0.5) / dpr;
  const margin = 0.5 / dpr;
  const maxX = drawableWidth - margin;
  if (xCrisp < margin) xCrisp = margin;
  if (xCrisp > maxX) xCrisp = maxX;
  return xCrisp;
}
