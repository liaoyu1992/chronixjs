import { describe, expect, it } from 'vitest';

import { defaultIconWrapperProps } from './icon-wrapper-spec.js';
import { resolveIconWrapperClassList } from './resolve-icon-wrapper-class-list.js';

describe('resolveIconWrapperClassList', () => {
  it('returns base class', () => {
    expect(resolveIconWrapperClassList(defaultIconWrapperProps)).toEqual(['cx-ui-icon-wrapper']);
  });
});
