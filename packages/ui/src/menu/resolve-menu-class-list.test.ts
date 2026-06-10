import { describe, expect, it } from 'vitest';

import { resolveMenuClassList, resolveMenuItemClassList } from './resolve-menu-class-list.js';

describe('resolveMenuClassList', () => {
  it('emits --mode-vertical by default', () => {
    expect(
      resolveMenuClassList({
        mode: 'vertical',
        collapsed: false,
        disabled: false,
      }),
    ).toEqual(['cx-ui-menu', 'cx-ui-menu--mode-vertical']);
  });

  it('emits --mode-horizontal', () => {
    expect(
      resolveMenuClassList({
        mode: 'horizontal',
        collapsed: false,
        disabled: false,
      }),
    ).toContain('cx-ui-menu--mode-horizontal');
  });

  it('only emits --collapsed when vertical', () => {
    expect(
      resolveMenuClassList({
        mode: 'vertical',
        collapsed: true,
        disabled: false,
      }),
    ).toContain('cx-ui-menu--collapsed');
    expect(
      resolveMenuClassList({
        mode: 'horizontal',
        collapsed: true,
        disabled: false,
      }),
    ).not.toContain('cx-ui-menu--collapsed');
  });

  it('emits --disabled when disabled=true', () => {
    expect(
      resolveMenuClassList({
        mode: 'vertical',
        collapsed: false,
        disabled: true,
      }),
    ).toContain('cx-ui-menu--disabled');
  });
});

describe('resolveMenuItemClassList', () => {
  it('returns base only for unflagged leaf', () => {
    expect(
      resolveMenuItemClassList({
        hasChildren: false,
        expanded: false,
        active: false,
        disabled: false,
      }),
    ).toEqual(['cx-ui-menu__item']);
  });

  it('emits --has-children and --expanded for an expanded branch', () => {
    const classes = resolveMenuItemClassList({
      hasChildren: true,
      expanded: true,
      active: false,
      disabled: false,
    });
    expect(classes).toContain('cx-ui-menu__item--has-children');
    expect(classes).toContain('cx-ui-menu__item--expanded');
  });

  it('emits --active and --disabled independently', () => {
    expect(
      resolveMenuItemClassList({
        hasChildren: false,
        expanded: false,
        active: true,
        disabled: false,
      }),
    ).toContain('cx-ui-menu__item--active');
    expect(
      resolveMenuItemClassList({
        hasChildren: false,
        expanded: false,
        active: false,
        disabled: true,
      }),
    ).toContain('cx-ui-menu__item--disabled');
  });
});
