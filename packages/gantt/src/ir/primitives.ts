/**
 * Pixel-alignment intent. Anti-regression hook #1: every render node that
 * draws a 1px line or sharp edge must declare this at IR-build time so the
 * paint layer can snap appropriately at any device-pixel ratio.
 */
export type DprIntent = 'crisp-pixel' | 'subpixel' | 'inherit';

export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
}

export interface Viewport {
  /** Width of the timeline body in screen pixels. */
  readonly width: number;
  /** Height of the timeline body in screen pixels. */
  readonly height: number;
  /** Current horizontal scroll offset inside the virtual timeline. */
  readonly scrollLeft: number;
  /** Current vertical scroll offset inside the virtual timeline. */
  readonly scrollTop: number;
  /** Device pixel ratio at the time of capture. */
  readonly dpr: number;
}
