import type { Hsv } from './convert-color.js';

/** Input to `computeHsvAtSquarePosition`. */
export interface HsvAtSquarePositionInput {
  /** Horizontal pointer position within the SV square (0 = left edge). */
  readonly positionPxX: number;
  /** Vertical pointer position within the SV square (0 = top edge). */
  readonly positionPxY: number;
  /** SV square width in pixels. */
  readonly squareWidthPx: number;
  /** SV square height in pixels. */
  readonly squareHeightPx: number;
  /** Current hue value (`0-360`); preserved in the returned HSV. */
  readonly currentHue: number;
}

/** Input to `computeSquarePositionForHsv`. */
export interface SquarePositionForHsvInput {
  /** HSV value whose `s` + `v` components drive the position. */
  readonly hsv: Hsv;
  /** SV square width in pixels. */
  readonly squareWidthPx: number;
  /** SV square height in pixels. */
  readonly squareHeightPx: number;
}

/** Pixel position output for SV-square thumb placement. */
export interface SquarePosition {
  /** Horizontal pixel offset from the square's left edge. */
  readonly positionPxX: number;
  /** Vertical pixel offset from the square's top edge. */
  readonly positionPxY: number;
}

/** Input to `computeHueAtStripPosition`. */
export interface HueAtStripPositionInput {
  /** Pointer position along the strip (0 = leading edge). */
  readonly positionPx: number;
  /** Strip length in pixels. */
  readonly stripSizePx: number;
}

/** Input to `computeStripPositionForHue`. */
export interface StripPositionForHueInput {
  /** Hue value `[0, 360)`. */
  readonly hue: number;
  /** Strip length in pixels. */
  readonly stripSizePx: number;
}

function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

/**
 * Resolve an HSV value from a pointer position within the SV square.
 *
 * Algorithm:
 *
 * 1. Degenerate dimensions (`squareWidthPx <= 0` OR `squareHeightPx
 *    <= 0`) return `{ h: currentHue, s: 0, v: 0 }` (black at the
 *    given hue).
 * 2. Saturation `s = clamp(positionPxX / squareWidthPx, 0, 1)`. X
 *    grows rightward; right edge = fully saturated.
 * 3. Value `v = 1 - clamp(positionPxY / squareHeightPx, 0, 1)`. Y
 *    grows downward; TOP edge = max brightness (the canonical color-
 *    picker UX where top-left is brightest pure color).
 * 4. Hue is preserved from `currentHue` — the SV square doesn't
 *    drive hue.
 */
export function computeHsvAtSquarePosition(input: HsvAtSquarePositionInput): Hsv {
  const { positionPxX, positionPxY, squareWidthPx, squareHeightPx, currentHue } = input;
  if (squareWidthPx <= 0 || squareHeightPx <= 0) {
    return { h: currentHue, s: 0, v: 0 };
  }
  const s = clamp(positionPxX / squareWidthPx, 0, 1);
  const v = 1 - clamp(positionPxY / squareHeightPx, 0, 1);
  return { h: currentHue, s, v };
}

/**
 * Inverse of `computeHsvAtSquarePosition`: return the pixel position
 * where the SV thumb should render for a given HSV value.
 *
 * Algorithm:
 *
 * 1. Degenerate dimensions return `{ positionPxX: 0, positionPxY: 0 }`.
 * 2. `positionPxX = clamp(s, 0, 1) * squareWidthPx`.
 * 3. `positionPxY = (1 - clamp(v, 0, 1)) * squareHeightPx`.
 */
export function computeSquarePositionForHsv(input: SquarePositionForHsvInput): SquarePosition {
  const { hsv, squareWidthPx, squareHeightPx } = input;
  if (squareWidthPx <= 0 || squareHeightPx <= 0) {
    return { positionPxX: 0, positionPxY: 0 };
  }
  const positionPxX = clamp(hsv.s, 0, 1) * squareWidthPx;
  const positionPxY = (1 - clamp(hsv.v, 0, 1)) * squareHeightPx;
  return { positionPxX, positionPxY };
}

/**
 * Resolve a hue value `[0, 360)` from a pointer position along the
 * hue strip.
 *
 * Algorithm:
 *
 * 1. Degenerate strip (`stripSizePx <= 0`) returns `0` (red).
 * 2. `ratio = clamp(positionPx / stripSizePx, 0, 1)`.
 * 3. Hue `= ratio * 360`; when `ratio === 1`, hue wraps to 0 to
 *    keep the canonical `[0, 360)` invariant.
 */
export function computeHueAtStripPosition(input: HueAtStripPositionInput): number {
  const { positionPx, stripSizePx } = input;
  if (stripSizePx <= 0) return 0;
  const ratio = clamp(positionPx / stripSizePx, 0, 1);
  const hue = ratio * 360;
  return hue >= 360 ? 0 : hue;
}

/**
 * Inverse of `computeHueAtStripPosition`: return the pixel position
 * where the hue thumb should render for a given hue value.
 *
 * Algorithm:
 *
 * 1. Degenerate strip returns `0`.
 * 2. Normalize hue to `[0, 360)`; values at or beyond 360 wrap to 0.
 * 3. `position = (hue / 360) * stripSizePx`.
 */
export function computeStripPositionForHue(input: StripPositionForHueInput): number {
  const { hue, stripSizePx } = input;
  if (stripSizePx <= 0) return 0;
  let normalized = hue % 360;
  if (normalized < 0) normalized += 360;
  return (normalized / 360) * stripSizePx;
}
