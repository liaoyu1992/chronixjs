/**
 * NumberAnimation component IR — .
 *
 * Props spec for an animated number display that tweens from one value
 * to another over a configurable duration. The adapter drives the
 * animation loop; the core IR provides the tween math and formatting.
 */

export interface NumberAnimationProps {
  readonly from: number;
  readonly to: number;
  readonly duration: number;
  readonly precision: number;
  readonly active?: boolean | undefined;
  readonly showSeparator?: boolean | undefined;
  readonly locale?: string;
}

export const defaultNumberAnimationProps: NumberAnimationProps = {
  from: 0,
  to: 0,
  duration: 2000,
  precision: 0,
  active: true,
  showSeparator: false,
};
