import { describe, expect, it } from 'vitest';

import { defaultGridProps } from './grid-spec.js';
import { resolveGridClassList } from './resolve-grid-class-list.js';

describe('resolveGridClassList', () => {
  it('returns just the base class for defaults', () => {
    expect(resolveGridClassList(defaultGridProps)).toEqual(['cx-ui-grid']);
  });

  it('adds --inline when inline=true', () => {
    expect(resolveGridClassList({ ...defaultGridProps, inline: true })).toEqual([
      'cx-ui-grid',
      'cx-ui-grid--inline',
    ]);
  });

  it('returns a fresh array per call', () => {
    const a = resolveGridClassList(defaultGridProps);
    const b = resolveGridClassList(defaultGridProps);
    expect(a).not.toBe(b);
  });
});
