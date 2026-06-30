/**
 * Compute the CSS animation duration (in seconds) for a Marquee
 * given the measured content width and the configured speed.
 *
 * .
 *
 * The Marquee `__track` contains TWO copies of the slot content
 * (for seamless looping); the animation moves the track by `-50%`
 * which equals one full content cycle. The pixel distance
 * traveled per cycle equals `contentSize` (the size of one copy
 * of the content). Time per cycle = pixels / pixels-per-second.
 *
 * Opt-out cases (return `0`):
 *
 * - `speed <= 0` — paused or invalid speed.
 * - `contentSize <= 0` — content hasn't been measured yet, or is
 *   degenerate; the adapter renders no animation until next
 *   measurement.
 *
 * Returns seconds as a number (NOT formatted with the `s` suffix
 * — the adapter formats `${duration}s` when assigning to the
 * `animation-duration` CSS property).
 */
export function computeMarqueeAnimationDurationSec(contentSize: number, speed: number): number {
  if (speed <= 0) return 0;
  if (contentSize <= 0) return 0;
  return contentSize / speed;
}
