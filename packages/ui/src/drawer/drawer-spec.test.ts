import { describe, expect, it } from 'vitest';

import { defaultDrawerProps, resolveDrawerDimensionStyle } from './drawer-spec.js';

describe('defaultDrawerProps', () => {
  it('matches defaults (placement right, width+height 400, all closables on)', () => {
    expect(defaultDrawerProps).toEqual({
      show: undefined,
      placement: 'right',
      title: undefined,
      mask: true,
      maskClosable: true,
      escClosable: true,
      width: 400,
      height: 400,
      disabled: false,
    });
  });
});

describe('resolveDrawerDimensionStyle', () => {
  it('returns width style for horizontal placements', () => {
    expect(
      resolveDrawerDimensionStyle({
        placement: 'right',
        width: 400,
        height: 400,
      }),
    ).toEqual({ width: '400px' });
    expect(
      resolveDrawerDimensionStyle({
        placement: 'left',
        width: '60%',
        height: 400,
      }),
    ).toEqual({ width: '60%' });
  });

  it('returns height style for vertical placements', () => {
    expect(
      resolveDrawerDimensionStyle({
        placement: 'top',
        width: 400,
        height: 300,
      }),
    ).toEqual({ height: '300px' });
    expect(
      resolveDrawerDimensionStyle({
        placement: 'bottom',
        width: 400,
        height: '50vh',
      }),
    ).toEqual({ height: '50vh' });
  });
});
