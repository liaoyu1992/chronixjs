/**
 * GradientText IR — Phase 24 (2026-06-03). Tier A text with
 * CSS linear-gradient applied via `background-clip: text`.
 */

export interface GradientTextProps {
  readonly value: string;
  /** Gradient start and end color stops. */
  readonly colors: readonly [string, string];
  /** Gradient direction in degrees. Default `90` = left → right. */
  readonly direction: number;
}

export const defaultGradientTextProps: GradientTextProps = {
  value: '',
  colors: ['#3b82f6', '#a855f7'],
  direction: 90,
};

/** Build the CSS `background` shorthand for the gradient. */
export function buildGradientTextBackground(props: GradientTextProps): string {
  return `linear-gradient(${props.direction}deg, ${props.colors[0]}, ${props.colors[1]})`;
}
