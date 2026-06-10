import { describe, expect, it } from 'vitest';

import { resolveDynamicInputClassList } from './resolve-dynamic-input-class-list.js';

describe('resolveDynamicInputClassList', () => {
  it('returns only base class when not disabled', () => {
    expect(resolveDynamicInputClassList({ disabled: false })).toEqual(['cx-ui-dynamic-input']);
  });

  it('adds --disabled modifier when disabled is true', () => {
    const classes = resolveDynamicInputClassList({ disabled: true });
    expect(classes).toContain('cx-ui-dynamic-input');
    expect(classes).toContain('cx-ui-dynamic-input--disabled');
  });

  it('omits --disabled when disabled is undefined', () => {
    const classes = resolveDynamicInputClassList({ disabled: undefined });
    expect(classes).toEqual(['cx-ui-dynamic-input']);
  });
});
