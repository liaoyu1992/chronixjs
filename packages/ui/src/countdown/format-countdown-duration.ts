import type { CountdownPrecision } from './countdown-spec.js';

/**
 * Pure helper — format a remaining-duration in milliseconds as the
 * display string `HH:mm:ss[.S/.SS/.SSS]`. Phase 18 (2026-06-02).
 *
 * Contract:
 *
 * - `remainingMs` is clamped to `[0, ∞)` — negative values render
 *   as `00:00:00` (with the appropriate fractional zeros).
 * - Non-finite `remainingMs` (`NaN` / `Infinity`) → `00:00:00` (same
 *   "safe fallback" precedent as `formatProgressPercentage`).
 * - Hours / minutes / seconds are zero-padded to 2 digits.
 * - `precision === 0` → no fractional suffix.
 * - `precision === 1` → `.S` (1 digit, truncated from the millisecond
 *   value; e.g. `123ms` → `.1`).
 * - `precision === 2` → `.SS` (2 digits, truncated; e.g. `123ms` → `.12`).
 * - `precision === 3` → `.SSS` (3 digits; e.g. `123ms` → `.123`).
 *
 * The fractional portion uses TRUNCATION (not rounding) on the ms
 * fraction so the displayed value never reads "ahead" of reality
 * during a tick interval — important for the OTP / rate-limit use
 * case where consumers expect "00:00:01.5" to mean "≥ 1500 ms left".
 */
export function formatCountdownDuration(
  remainingMs: number,
  precision: CountdownPrecision,
): string {
  const clamped = Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0;
  const totalSec = Math.floor(clamped / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  const base = `${hh}:${mm}:${ss}`;
  if (precision === 0) return base;
  const fracMs = Math.floor(clamped % 1000);
  const fracStr = String(fracMs).padStart(3, '0').slice(0, precision);
  return `${base}.${fracStr}`;
}
