import type { SpaceSize } from './space-spec.js';

/**
 * Pure helper — convert a Space `size` (discrete token or numeric
 * px) into a CSS `gap` value string. Phase 17 (2026-06-02). Shared
 * by all 3 adapters so the rendered inline-style is byte-identical
 * across vue3 / vue2 / react.
 *
 * Contract:
 *
 * - `'small'` / `'medium'` / `'large'` → `var(--cx-ui-space-gap-{tok}, {pxFallback})`
 *   where the px fallback is `8px` / `12px` / `24px`. The CSS-var
 *   indirection lets consumers override per-theme via
 *   `<ChronixUIProvider>` token overrides.
 * - Numeric value → `${n}px` verbatim. `0` returns `'0px'` (not
 *   bare `0`) so the inline style is always a CSS length.
 *
 * The 3-step token ladder mirrors Button/Tag/Card size tokens for
 * consumer-mental-model alignment (small/medium/large reads as
 * "tighter/default/looser spacing").
 */
export function resolveSpaceGap(size: SpaceSize | number): string {
  if (typeof size === 'number') return `${size}px`;
  const fallback = size === 'small' ? '8px' : size === 'large' ? '24px' : '12px';
  return `var(--cx-ui-space-gap-${size}, ${fallback})`;
}
