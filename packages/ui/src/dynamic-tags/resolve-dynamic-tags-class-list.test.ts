import { describe, expect, it } from 'vitest';

import { resolveDynamicTagsClassList } from './resolve-dynamic-tags-class-list.js';

describe('resolveDynamicTagsClassList', () => {
  it('returns only base class when not disabled', () => {
    expect(resolveDynamicTagsClassList({ disabled: false })).toEqual(['cx-ui-dynamic-tags']);
  });

  it('adds --disabled modifier when disabled is true', () => {
    const classes = resolveDynamicTagsClassList({ disabled: true });
    expect(classes).toContain('cx-ui-dynamic-tags');
    expect(classes).toContain('cx-ui-dynamic-tags--disabled');
  });

  it('omits --disabled when disabled is undefined', () => {
    const classes = resolveDynamicTagsClassList({ disabled: undefined });
    expect(classes).toEqual(['cx-ui-dynamic-tags']);
  });
});
