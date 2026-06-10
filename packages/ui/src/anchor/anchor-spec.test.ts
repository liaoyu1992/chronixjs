import { describe, expect, it } from 'vitest';

import { defaultAnchorProps, type AnchorProps } from './anchor-spec.js';

describe('defaultAnchorProps', () => {
  it('matches defaults', () => {
    expect(defaultAnchorProps).toEqual({
      items: [],
      showRail: true,
      showBackground: true,
      bound: 12,
    });
  });

  it('items is an empty array by default', () => {
    const props: AnchorProps = { ...defaultAnchorProps };
    expect(props.items).toEqual([]);
    expect(props.items).toHaveLength(0);
  });

  it('bound defaults to 12', () => {
    expect(defaultAnchorProps.bound).toBe(12);
  });
});
