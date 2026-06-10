import { describe, expect, it } from 'vitest';

import { defaultInfiniteScrollProps, type InfiniteScrollProps } from './infinite-scroll-spec.js';

describe('defaultInfiniteScrollProps', () => {
  it('matches defaults', () => {
    expect(defaultInfiniteScrollProps).toEqual({
      distance: 0,
      loading: false,
    });
  });

  it('distance defaults to 0', () => {
    const props: InfiniteScrollProps = { ...defaultInfiniteScrollProps };
    expect(props.distance).toBe(0);
  });

  it('loading defaults to false', () => {
    expect(defaultInfiniteScrollProps.loading).toBe(false);
  });
});
