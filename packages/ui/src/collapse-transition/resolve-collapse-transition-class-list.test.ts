import { describe, expect, it } from 'vitest';

import { resolveCollapseTransitionClassList } from './resolve-collapse-transition-class-list.js';

describe('resolveCollapseTransitionClassList', () => {
  it('returns base only when show=false', () => {
    expect(resolveCollapseTransitionClassList({ show: false })).toEqual([
      'cx-ui-collapse-transition',
    ]);
  });

  it('adds --expanded when show=true', () => {
    expect(resolveCollapseTransitionClassList({ show: true })).toContain(
      'cx-ui-collapse-transition--expanded',
    );
  });
});
