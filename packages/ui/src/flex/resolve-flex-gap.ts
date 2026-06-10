import type { FlexGap } from './flex-spec.js';

/**
 * Pure helper — convert a Flex `gap` (token / numeric / undefined)
 * into a CSS `gap` value string OR `undefined` (caller omits the
 * style declaration). Phase 17 (2026-06-02). Mirrors Space's
 * `resolveSpaceGap` token table; the token CSS-vars are shared
 * (`--cx-ui-space-gap-{tok}`) so consumers can override once and
 * have both Space + Flex inherit.
 *
 * Contract:
 *
 * - `undefined` → `undefined` (caller omits the inline style).
 * - Discrete tokens (`'small' | 'medium' | 'large'`) →
 *   `var(--cx-ui-space-gap-{tok}, {pxFallback})`.
 * - Numeric value → `${n}px`.
 */
export function resolveFlexGap(gap: FlexGap | undefined): string | undefined {
  if (gap === undefined) return undefined;
  if (typeof gap === 'number') return `${gap}px`;
  const fallback = gap === 'small' ? '8px' : gap === 'large' ? '24px' : '12px';
  return `var(--cx-ui-space-gap-${gap}, ${fallback})`;
}
