import type { TransitionSpec } from './transition-spec.js';

/**
 * Format a CSS `transition` property value from a list of property
 * names + a `TransitionSpec`. Pure helper.
 *
 * . Output is a comma-separated list of
 * `property duration easing[ delay]` entries, suitable for inline
 * `style.transition` or a `.css` `transition: ...` declaration.
 *
 * Examples:
 *
 * ```ts
 * formatCssTransitionShorthand(['opacity'], defaultTransitionSpec)
 * // → 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)'
 *
 * formatCssTransitionShorthand(['opacity', 'transform'], {
 *   durationMs: 300, easing: 'ease-out', delayMs: 50,
 * })
 * // → 'opacity 300ms ease-out 50ms, transform 300ms ease-out 50ms'
 * ```
 *
 * `delayMs: 0` is omitted from the output (CSS treats no-delay and
 * `0ms` identically; the shorter form keeps inline styles compact).
 *
 * Empty `properties` array returns the empty string — caller should
 * not set `style.transition = ''` to that result unconditionally (it
 * clears any previous transition); guard at the call site.
 */
export function formatCssTransitionShorthand(
  properties: readonly string[],
  spec: TransitionSpec,
): string {
  if (properties.length === 0) return '';
  const delayPart = spec.delayMs > 0 ? ` ${spec.delayMs}ms` : '';
  return properties
    .map((prop) => `${prop} ${spec.durationMs}ms ${spec.easing}${delayPart}`)
    .join(', ');
}
