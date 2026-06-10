import { describe, expect, it } from 'vitest';

import { resolveNumberAnimationClassList } from './resolve-number-animation-class-list.js';

describe('resolveNumberAnimationClassList', () => {
  it('returns only the base class', () => {
    expect(resolveNumberAnimationClassList()).toEqual(['cx-ui-number-animation']);
  });
});
