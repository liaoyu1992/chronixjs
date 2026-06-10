import { describe, expect, it } from 'vitest';

import { resolveSplitClassList } from './resolve-split-class-list.js';

describe('resolveSplitClassList', () => {
  it('horizontal + enabled returns base + direction modifier', () => {
    expect(resolveSplitClassList({ direction: 'horizontal', disabled: false })).toEqual([
      'cx-ui-split',
      'cx-ui-split--direction-horizontal',
    ]);
  });

  it('vertical + enabled', () => {
    expect(resolveSplitClassList({ direction: 'vertical', disabled: false })).toContain(
      'cx-ui-split--direction-vertical',
    );
  });

  it('appends --disabled when disabled=true', () => {
    expect(resolveSplitClassList({ direction: 'horizontal', disabled: true })).toContain(
      'cx-ui-split--disabled',
    );
  });
});
