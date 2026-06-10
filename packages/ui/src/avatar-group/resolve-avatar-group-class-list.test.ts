import { describe, expect, it } from 'vitest';

import { defaultAvatarGroupProps, type AvatarGroupProps } from './avatar-group-spec.js';
import { resolveAvatarGroupClassList } from './resolve-avatar-group-class-list.js';

function props(over: Partial<AvatarGroupProps> = {}): AvatarGroupProps {
  return { ...defaultAvatarGroupProps, ...over };
}

describe('resolveAvatarGroupClassList', () => {
  it('returns base + --circle by default', () => {
    expect(resolveAvatarGroupClassList(props())).toEqual([
      'cx-ui-avatar-group',
      'cx-ui-avatar-group--circle',
    ]);
  });

  it.each(['circle', 'square', 'round'] as const)('emits --%s modifier per shape', (shape) => {
    expect(resolveAvatarGroupClassList(props({ shape }))).toContain(`cx-ui-avatar-group--${shape}`);
  });
});
