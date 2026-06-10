import type { WatermarkProps } from './watermark-spec.js';

/**
 * Compute class set for the Watermark root element.
 *
 * Phase 22 (2026-06-03).
 *
 * Watermark currently has no root-level modifiers — every visual
 * axis (content / color / opacity / rotate / size) is encoded
 * inline via `style.backgroundImage`. The signature is kept
 * consistent with the `resolveXxxClassList(props)` cookbook so
 * a future root-level modifier (e.g. `--inline` for
 * non-overlaying use) can be added without breaking the helper
 * shape.
 */
export function resolveWatermarkClassList(_props: WatermarkProps): string[] {
  return ['cx-ui-watermark'];
}
