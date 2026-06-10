import { describe, expect, it } from 'vitest';

import {
  resolveTabItemClassList,
  resolveTabsAddButtonClassList,
  resolveTabsClassList,
} from './resolve-tabs-class-list.js';

describe('resolveTabsClassList', () => {
  it('returns base + 3 modifiers (type / placement / size) by default', () => {
    expect(
      resolveTabsClassList({
        type: 'line',
        placement: 'top',
        size: 'medium',
        disabled: false,
      }),
    ).toEqual([
      'cx-ui-tabs',
      'cx-ui-tabs--type-line',
      'cx-ui-tabs--placement-top',
      'cx-ui-tabs--size-medium',
    ]);
  });

  it('appends --disabled modifier when disabled=true', () => {
    expect(
      resolveTabsClassList({
        type: 'card',
        placement: 'left',
        size: 'large',
        disabled: true,
      }),
    ).toEqual([
      'cx-ui-tabs',
      'cx-ui-tabs--type-card',
      'cx-ui-tabs--placement-left',
      'cx-ui-tabs--size-large',
      'cx-ui-tabs--disabled',
    ]);
  });

  it('drives segment + bottom + small variants too', () => {
    const c = resolveTabsClassList({
      type: 'segment',
      placement: 'bottom',
      size: 'small',
      disabled: false,
    });
    expect(c).toContain('cx-ui-tabs--type-segment');
    expect(c).toContain('cx-ui-tabs--placement-bottom');
    expect(c).toContain('cx-ui-tabs--size-small');
  });
});

describe('resolveTabItemClassList', () => {
  it('returns just base class when inactive + enabled + not closable', () => {
    expect(resolveTabItemClassList({ active: false, disabled: false, closable: false })).toEqual([
      'cx-ui-tabs__tab',
    ]);
  });

  it('appends --active when active=true', () => {
    expect(resolveTabItemClassList({ active: true, disabled: false, closable: false })).toContain(
      'cx-ui-tabs__tab--active',
    );
  });

  it('appends --disabled when disabled=true', () => {
    expect(resolveTabItemClassList({ active: false, disabled: true, closable: false })).toContain(
      'cx-ui-tabs__tab--disabled',
    );
  });

  it('appends --closable when closable=true', () => {
    expect(resolveTabItemClassList({ active: false, disabled: false, closable: true })).toContain(
      'cx-ui-tabs__tab--closable',
    );
  });

  it('combines active + closable modifiers', () => {
    const result = resolveTabItemClassList({ active: true, disabled: false, closable: true });
    expect(result).toContain('cx-ui-tabs__tab--active');
    expect(result).toContain('cx-ui-tabs__tab--closable');
  });
});

describe('resolveTabsAddButtonClassList', () => {
  it('returns the add-btn class', () => {
    expect(resolveTabsAddButtonClassList()).toEqual(['cx-ui-tabs__add-btn']);
  });
});
