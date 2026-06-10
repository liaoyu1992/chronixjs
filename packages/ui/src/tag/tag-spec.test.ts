import { describe, expect, it } from 'vitest';

import { defaultTagProps, type TagProps } from './tag-spec.js';

describe('defaultTagProps', () => {
  it('matches the documented defaults (non-closable, bordered, medium, default type)', () => {
    expect(defaultTagProps).toEqual({
      type: 'default',
      size: 'medium',
      bordered: true,
      round: false,
      closable: false,
      disabled: false,
    });
  });

  it('is a structurally typed ButtonProps-shape that adapters can spread', () => {
    const override: TagProps = { ...defaultTagProps, type: 'success', size: 'small' };
    expect(override.type).toBe('success');
    expect(override.size).toBe('small');
    // Spread leaves untouched fields at default.
    expect(override.bordered).toBe(true);
    expect(override.round).toBe(false);
  });
});
