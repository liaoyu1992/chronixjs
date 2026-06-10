import type { AvatarGroupProps } from './avatar-group-spec.js';

export function resolveAvatarGroupClassList(props: AvatarGroupProps): string[] {
  return ['cx-ui-avatar-group', `cx-ui-avatar-group--${props.shape}`];
}
