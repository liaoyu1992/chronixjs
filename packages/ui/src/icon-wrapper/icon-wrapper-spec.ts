/**
 * IconWrapper IR — . Tier A sizing + coloring
 * wrapper for arbitrary icon content.
 */

export interface IconWrapperProps {
  /** Width + height in px. */
  readonly size: number;
  /** Optional color applied via inline `color`; undefined inherits. */
  readonly color: string | undefined;
}

export const defaultIconWrapperProps: IconWrapperProps = {
  size: 24,
  color: undefined,
};
