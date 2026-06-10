import { describe, expect, it } from 'vitest';

import { defaultScrollbarProps } from './scrollbar-spec.js';

describe('defaultScrollbarProps', () => {
  it('matches defaults', () => {
    expect(defaultScrollbarProps).toEqual({
      trigger: 'hover',
      xScrollable: false,
    });
  });

  it('trigger defaults to hover', () => {
    expect(defaultScrollbarProps.trigger).toBe('hover');
  });

  it('xScrollable defaults to false', () => {
    expect(defaultScrollbarProps.xScrollable).toBe(false);
  });
});
