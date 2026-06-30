/**
 * Countdown IR — . Tier A "live" display.
 *
 * Renders a `(label, prefix, remaining-time, suffix)` block that
 * ticks down to 0. Same DOM shape as Statistic but the `__value`
 * text is computed by the adapter via `formatCountdownDuration` on
 * each tick. The adapter owns its own `setInterval` lifecycle per
 * Decision D.1 — IR is pure data + helpers.
 *
 * Public surface:
 *
 * - **`CountdownPrecision`** — closed union `0 | 1 | 2 | 3`. Drives
 *   both the tick cadence (`computeCountdownTickIntervalMs`) and the
 *   format fractional-seconds suffix (`formatCountdownDuration`).
 * - **`CountdownProps`** + **`defaultCountdownProps`**.
 * - **`resolveCountdownClassList`** pure helper.
 * - **`formatCountdownDuration`** + **`computeCountdownTickIntervalMs`**
 *   pure helpers (see sibling files).
 */

/** Decimal precision for the fractional-seconds suffix. */
export type CountdownPrecision = 0 | 1 | 2 | 3;

export interface CountdownProps {
  /** Heading label. `undefined` omits the label row. */
  readonly label: string | undefined;
  /**
   * Total countdown duration in milliseconds. Must be `>= 0`;
   * negative values clamp to 0 inside the formatter.
   */
  readonly duration: number;
  /**
   * Decimal precision for the fractional-seconds suffix:
   * - `0` (default): `HH:mm:ss` (tick every 1000 ms)
   * - `1`: `HH:mm:ss.S` (tick every 100 ms)
   * - `2`: `HH:mm:ss.SS` (tick every 100 ms)
   * - `3`: `HH:mm:ss.SSS` (tick every 10 ms)
   */
  readonly precision: CountdownPrecision;
  /**
   * When `true` (default), the timer runs. When `false`, the adapter
   * stops the interval. Flipping back to `true` restarts from
   * `duration` (no pause/resume preserve-state in v0.1.0 per
   * Decision E.1).
   */
  readonly active: boolean;
}

export const defaultCountdownProps: CountdownProps = {
  label: undefined,
  duration: 0,
  precision: 0,
  active: true,
};
