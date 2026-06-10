import { describe, expect, it } from 'vitest';

import { resolvePopconfirmClassList } from './resolve-popconfirm-class-list.js';

describe('resolvePopconfirmClassList', () => {
  it('returns base + --top for default placement (closed)', () => {
    expect(resolvePopconfirmClassList({ actualPlacement: 'top', open: false })).toEqual([
      'cx-ui-popconfirm',
      'cx-ui-popconfirm--top',
    ]);
  });

  it('adds --open when open=true', () => {
    expect(resolvePopconfirmClassList({ actualPlacement: 'top', open: true })).toContain(
      'cx-ui-popconfirm--open',
    );
  });
});
