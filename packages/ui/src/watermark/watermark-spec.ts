/**
 * Watermark IR — Phase 22 (2026-06-03). Tier A repeating
 * overlay watermark for DRAFT / CONFIDENTIAL / user-ID
 * watermarking.
 *
 * Renders a single `<div>` wrapping the default-slot content with
 * a CSS `background-image` of an SVG `data:` URL containing the
 * rotated text. The browser auto-tiles via `background-repeat:
 * repeat`. The watermark layer is `pointer-events: none` so it
 * clicks through to the underlying content.
 *
 * Public surface:
 *
 * - **`WatermarkProps`** + **`defaultWatermarkProps`**.
 *
 * Per Phase 22 Decision B.1 the rendering primitive is SVG
 * data-URI; helper `encodeWatermarkSvgDataUrl(props)` is the
 * single source of truth for the data-URL content (testable in
 * isolation, framework-agnostic).
 */

export interface WatermarkProps {
  /** Watermark text rendered inside each tile. */
  readonly content: string;
  /** Tile width in pixels. Drives both SVG width and CSS background-size. */
  readonly width: number;
  /** Tile height in pixels. */
  readonly height: number;
  /** Rotation angle in degrees applied to the SVG `<text>` element. */
  readonly rotate: number;
  /** Font size in pixels. */
  readonly fontSize: number;
  /** Fill color for the watermark text (any valid CSS color). */
  readonly color: string;
  /** Fill opacity, 0..1. */
  readonly opacity: number;
}

export const defaultWatermarkProps: WatermarkProps = {
  content: 'Watermark',
  width: 200,
  height: 80,
  rotate: -22,
  fontSize: 16,
  color: '#000000',
  opacity: 0.15,
};
