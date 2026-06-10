import type { AvatarProps } from './avatar-spec.js';

export function resolveAvatarClassList(props: AvatarProps): string[] {
  return ['cx-ui-avatar', `cx-ui-avatar--${props.shape}`];
}
