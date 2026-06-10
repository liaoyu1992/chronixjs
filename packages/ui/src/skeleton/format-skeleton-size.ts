/**
 * Pure helper — convert a Skeleton `width` / `height` prop into a CSS
 * length string suitable for inline `style.width` / `style.height`.
 *
 * Phase 16 (2026-06-02). Shared across vue3 / vue2 / react adapters so
 * the rendered inline-style string is byte-identical across adapters.
 *
 * Contract:
 *
 * - `undefined` → `undefined` (caller omits the style declaration
 *   entirely; the shape's CSS-default sizing applies).
 * - Numeric value → `"${value}px"` (`0` → `"0px"`, `200` → `"200px"`).
 *   Negative numbers are passed through verbatim with `px` suffix
 *   (caller responsibility — no clamping; matches Phase 14
 *   formatBadgeValue's "no special-casing below zero" precedent).
 * - String value → returned verbatim (consumer-supplied CSS length
 *   like `"100%"`, `"3em"`, `"clamp(100px, 50%, 400px)"`). Empty
 *   string returns empty string (caller may treat as no-op).
 */
export function formatSkeletonSize(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
}
