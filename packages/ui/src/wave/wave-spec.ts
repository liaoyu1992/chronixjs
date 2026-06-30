/**
 * Wave component IR — . Tier B trivial CSS-ripple
 * wrapper. Pointerdown on the wrapped element triggers a brief CSS
 * keyframe animation via the `--rippling` modifier class.
 *
 * Adapter manages the boolean `rippling` state + a timer that clears
 * it after `duration` ms. No core algorithm needed; the keyframes
 * live in `wave-styles.ts`.
 *
 * Out-of-scope (v0.2):
 * - Multiple overlapping waves (currently 1 at a time per wrapper).
 * - Ripple from custom origin (currently centered).
 * - Custom keyframes / curves beyond `duration`.
 * - Hover-trigger variant (click-only).
 */

export const DEFAULT_WAVE_DURATION_MS = 600;

export interface WaveProps {
  /**
   * Optional CSS color string for the ripple. Falls back to the
   * `--cx-ui-wave-color` CSS variable when undefined.
   */
  readonly color: string | undefined;
  /** Animation duration in ms. */
  readonly duration: number;
  readonly disabled: boolean;
}

export const defaultWaveProps: WaveProps = {
  color: undefined,
  duration: DEFAULT_WAVE_DURATION_MS,
  disabled: false,
};
