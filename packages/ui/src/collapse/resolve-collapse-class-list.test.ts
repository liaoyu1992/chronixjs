import { describe, expect, it } from 'vitest';

import {
  resolveCollapseClassList,
  resolveCollapseItemClassList,
} from './resolve-collapse-class-list.js';

describe('resolveCollapseClassList', () => {
  it('returns base + arrow-left by default', () => {
    expect(resolveCollapseClassList({ arrowPlacement: 'left' })).toEqual([
      'cx-ui-collapse',
      'cx-ui-collapse--arrow-left',
    ]);
  });

  it('switches modifier when arrowPlacement is right', () => {
    expect(resolveCollapseClassList({ arrowPlacement: 'right' })).toContain(
      'cx-ui-collapse--arrow-right',
    );
  });
});

describe('resolveCollapseItemClassList', () => {
  it('returns base only when collapsed + enabled', () => {
    expect(resolveCollapseItemClassList({ expanded: false, disabled: false })).toEqual([
      'cx-ui-collapse__item',
    ]);
  });

  it('appends --expanded when expanded=true', () => {
    expect(resolveCollapseItemClassList({ expanded: true, disabled: false })).toContain(
      'cx-ui-collapse__item--expanded',
    );
  });

  it('appends --disabled when disabled=true', () => {
    expect(resolveCollapseItemClassList({ expanded: false, disabled: true })).toContain(
      'cx-ui-collapse__item--disabled',
    );
  });
});
