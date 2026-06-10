/**
 * Heatmap IR — Phase 24 (2026-06-03). Tier A SVG cell grid with
 * linear color interpolation between two endpoint colors.
 */

export interface HeatmapProps {
  /** 2D matrix of numeric values. Rows × columns. */
  readonly cells: readonly (readonly number[])[];
  /** Cell width + height in px. */
  readonly cellSize: number;
  /** Color for min(cells). */
  readonly colorLow: string;
  /** Color for max(cells). */
  readonly colorHigh: string;
}

export const defaultHeatmapProps: HeatmapProps = {
  cells: [],
  cellSize: 20,
  colorLow: '#dbeafe',
  colorHigh: '#1e3a8a',
};

export interface HeatmapValueRange {
  readonly min: number;
  readonly max: number;
}

/**
 * Find min / max across all numeric cells. Empty input returns
 * `{ min: 0, max: 0 }` so callers can divide-by-(max-min) safely
 * (they should also short-circuit on this case).
 */
export function findHeatmapValueRange(cells: readonly (readonly number[])[]): HeatmapValueRange {
  let min = Infinity;
  let max = -Infinity;
  for (const row of cells) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 0 };
  return { min, max };
}

function parseHexColor(hex: string): { r: number; g: number; b: number } | undefined {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return undefined;
  const v = parseInt(m[1]!, 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

function toHex(component: number): string {
  return Math.max(0, Math.min(255, Math.round(component)))
    .toString(16)
    .padStart(2, '0');
}

/**
 * Interpolate a CSS color string between `colorLow` and `colorHigh`
 * based on `value`'s position within `[min, max]`. Returns the
 * `colorLow` literal when value <= min OR min === max (no range);
 * returns the `colorHigh` literal when value >= max. For
 * non-hex-color inputs, falls back to returning `colorLow`.
 */
export function interpolateHeatmapColor(
  value: number,
  min: number,
  max: number,
  colorLow: string,
  colorHigh: string,
): string {
  if (min === max) return colorLow;
  if (value <= min) return colorLow;
  if (value >= max) return colorHigh;
  const low = parseHexColor(colorLow);
  const high = parseHexColor(colorHigh);
  if (low === undefined || high === undefined) return colorLow;
  const t = (value - min) / (max - min);
  const r = low.r + (high.r - low.r) * t;
  const g = low.g + (high.g - low.g) * t;
  const b = low.b + (high.b - low.b) * t;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
