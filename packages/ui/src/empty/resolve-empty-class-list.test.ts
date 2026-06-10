import { describe, expect, it } from 'vitest';

import { defaultEmptyProps } from './empty-spec.js';
import { resolveEmptyClassList } from './resolve-empty-class-list.js';

describe('resolveEmptyClassList', () => {
  it('returns base + medium + with-description for defaults', () => {
    expect(resolveEmptyClassList(defaultEmptyProps, false)).toEqual([
      'cx-ui-empty',
      'cx-ui-empty--medium',
      'cx-ui-empty--with-description',
    ]);
  });

  it('reflects all 3 sizes', () => {
    for (const s of ['small', 'medium', 'large'] as const) {
      const classes = resolveEmptyClassList({ ...defaultEmptyProps, size: s }, false);
      expect(classes).toContain(`cx-ui-empty--${s}`);
    }
  });

  it('omits --with-description when description is undefined', () => {
    expect(
      resolveEmptyClassList({ ...defaultEmptyProps, description: undefined }, false),
    ).not.toContain('cx-ui-empty--with-description');
  });

  it('adds --with-extra when hasExtra is true', () => {
    expect(resolveEmptyClassList(defaultEmptyProps, true)).toContain('cx-ui-empty--with-extra');
  });
});
