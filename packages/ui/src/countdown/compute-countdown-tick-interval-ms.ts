import type { CountdownPrecision } from './countdown-spec.js';

/**
 * Pure helper — derive the tick cadence (in milliseconds) for a
 * Countdown of the requested precision. .
 *
 * Contract:
 *
 * - `precision: 0` → `1000` ms (whole seconds; no need to tick more
 *   often than the rendered text changes).
 * - `precision: 1` → `100` ms (10 ticks/sec covers .S resolution).
 * - `precision: 2` → `100` ms (still 10 ticks/sec; .SS resolution
 *   is achieved by the format helper, not by ticking faster than
 *   the human eye perceives — saves CPU vs 10 ms ticks).
 * - `precision: 3` → `10` ms (100 ticks/sec; needed for .SSS to
 *   feel smooth — borders on rAF territory but `setInterval` is
 *   stable enough at this cadence on modern engines).
 *
 * This is intentionally a step function (not linear) so consumers
 * who choose `precision: 2` for visual style don't get billed for
 * the 10 ms timer cost they don't need.
 */
export function computeCountdownTickIntervalMs(precision: CountdownPrecision): number {
  if (precision === 0) return 1000;
  if (precision === 3) return 10;
  return 100;
}
