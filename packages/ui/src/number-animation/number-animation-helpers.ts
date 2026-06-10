/**
 * Linear interpolation between `from` and `to` at the given `progress`.
 *
 * @param from    Start value.
 * @param to      End value.
 * @param progress  A number in [0, 1]. 0 returns `from`, 1 returns `to`.
 */
export function computeNumberAnimationTween(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/**
 * Format a number for display in the animation.
 *
 * @param value         The numeric value to format.
 * @param precision     Decimal places (toFixed precision).
 * @param showSeparator Whether to insert locale-aware thousand separators.
 * @param locale        Optional locale string for Intl.NumberFormat.
 */
export function formatAnimatedNumber(
  value: number,
  precision: number,
  showSeparator: boolean,
  locale?: string,
): string {
  const fixed = value.toFixed(precision);
  if (!showSeparator) return fixed;

  const resolvedLocale = locale ?? 'en-US';
  const num = parseFloat(fixed);
  return new Intl.NumberFormat(resolvedLocale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(num);
}
