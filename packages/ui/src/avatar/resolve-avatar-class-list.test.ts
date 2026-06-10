import { describe, expect, it } from 'vitest';

import { defaultAvatarProps, type AvatarProps } from './avatar-spec.js';
import { resolveAvatarClassList } from './resolve-avatar-class-list.js';

function props(over: Partial<AvatarProps> = {}): AvatarProps {
  return { ...defaultAvatarProps, ...over };
}

describe('resolveAvatarClassList', () => {
  it('returns base + --circle by default', () => {
    expect(resolveAvatarClassList(props())).toEqual(['cx-ui-avatar', 'cx-ui-avatar--circle']);
  });

  it.each(['circle', 'square', 'round'] as const)('emits --%s modifier per shape', (shape) => {
    expect(resolveAvatarClassList(props({ shape }))).toContain(`cx-ui-avatar--${shape}`);
  });
});
