import { describe, expect, it } from 'vitest';

import { defaultIconProps } from './icon-props.js';
import { resolveIconClassList } from './resolve-icon-class-list.js';

describe('resolveIconClassList', () => {
  it('returns base + --missing for an unregistered name', () => {
    expect(resolveIconClassList({ ...defaultIconProps, name: 'unknown' })).toEqual([
      'cx-ui-icon',
      'cx-ui-icon--missing',
    ]);
  });

  it('returns base only for a registered icon', () => {
    expect(resolveIconClassList({ ...defaultIconProps, name: 'check' })).toEqual(['cx-ui-icon']);
  });
});
