/**
 * FloatButton component IR — Phase 28 (2026-06-04). Tier B floating
 * action button anchored to a viewport corner. Adapter wraps the
 * button in `<ChronixTooltip>` when `tooltip` is defined.
 *
 * Out-of-scope (v0.2):
 * - Badge support (count indicator).
 * - Custom placement variants beyond corner-anchored.
 */

export type FloatButtonShape = 'circle' | 'square';
export type FloatButtonType = 'default' | 'primary';

export interface FloatButtonProps {
  readonly shape: FloatButtonShape;
  readonly type: FloatButtonType;
  /** Distance from viewport right edge in px. */
  readonly right: number;
  /** Distance from viewport bottom edge in px. */
  readonly bottom: number;
  /** When defined, takes precedence over `bottom` and pins to top. */
  readonly top: number | undefined;
  /** When defined, takes precedence over `right` and pins to left. */
  readonly left: number | undefined;
  /** Phase 9 IconRegistry name. */
  readonly icon: string | undefined;
  /**
   * Hover tooltip text. Adapter wraps button in `<ChronixTooltip>`
   * with `trigger: 'hover'` / `placement: 'top'` when this is set.
   */
  readonly tooltip: string | undefined;
  /** Short text rendered beneath / next to the icon inside the button. */
  readonly description: string | undefined;
}

export const defaultFloatButtonProps: FloatButtonProps = {
  shape: 'circle',
  type: 'default',
  right: 24,
  bottom: 24,
  top: undefined,
  left: undefined,
  icon: undefined,
  tooltip: undefined,
  description: undefined,
};

/**
 * Resolve the position inline style for a corner-anchored float
 * element. `top` / `left` override `bottom` / `right` when defined.
 * Pure helper — adapter spreads result into the `position: fixed`
 * wrapper's inline style.
 */
export function resolveFloatButtonPositionStyle(input: {
  readonly right: number;
  readonly bottom: number;
  readonly top: number | undefined;
  readonly left: number | undefined;
}): Record<string, string> {
  const style: Record<string, string> = { position: 'fixed' };
  if (input.top !== undefined) {
    style['top'] = `${input.top}px`;
  } else {
    style['bottom'] = `${input.bottom}px`;
  }
  if (input.left !== undefined) {
    style['left'] = `${input.left}px`;
  } else {
    style['right'] = `${input.right}px`;
  }
  return style;
}
