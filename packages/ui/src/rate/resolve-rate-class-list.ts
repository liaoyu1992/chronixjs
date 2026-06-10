import type { RateProps } from './rate-spec.js';

export function resolveRateClassList(props: RateProps): string[] {
  const classes = ['cx-ui-rate'];
  if (props.disabled) classes.push('cx-ui-rate--disabled');
  if (props.readonly) classes.push('cx-ui-rate--readonly');
  if (props.error !== undefined) classes.push('cx-ui-rate--invalid');
  return classes;
}
