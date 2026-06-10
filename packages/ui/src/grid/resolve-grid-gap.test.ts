import { describe, expect, it } from 'vitest';

import { resolveGridGap } from './resolve-grid-gap.js';

describe('resolveGridGap', () => {
  it('returns both undefined when both axes are undefined', () => {
    expect(resolveGridGap(undefined, undefined)).toEqual({
      columnGap: undefined,
      rowGap: undefined,
    });
  });

  it('emits only columnGap when xGap is defined', () => {
    expect(resolveGridGap(12, undefined)).toEqual({
      columnGap: '12px',
      rowGap: undefined,
    });
  });

  it('emits only rowGap when yGap is defined', () => {
    expect(resolveGridGap(undefined, 8)).toEqual({
      columnGap: undefined,
      rowGap: '8px',
    });
  });

  it('emits both axes when both supplied', () => {
    expect(resolveGridGap(16, 4)).toEqual({
      columnGap: '16px',
      rowGap: '4px',
    });
  });

  it('zero gap emits "0px" (CSS length, not bare 0)', () => {
    expect(resolveGridGap(0, 0)).toEqual({
      columnGap: '0px',
      rowGap: '0px',
    });
  });

  it('passes negative values through verbatim (no clamping)', () => {
    expect(resolveGridGap(-4, undefined)).toEqual({
      columnGap: '-4px',
      rowGap: undefined,
    });
  });
});
