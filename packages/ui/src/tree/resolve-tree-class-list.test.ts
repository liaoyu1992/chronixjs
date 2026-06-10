import { describe, expect, it } from 'vitest';

import {
  resolveTreeArrowClassList,
  resolveTreeClassList,
  resolveTreeDropIndicatorClassList,
  resolveTreeRowClassList,
} from './resolve-tree-class-list.js';

describe('resolveTreeClassList', () => {
  it('default returns base class only', () => {
    expect(resolveTreeClassList({ virtual: false, disabled: false })).toEqual(['cx-ui-tree']);
  });

  it('virtual adds --virtual modifier', () => {
    expect(resolveTreeClassList({ virtual: true, disabled: false })).toEqual([
      'cx-ui-tree',
      'cx-ui-tree--virtual',
    ]);
  });

  it('disabled adds --disabled modifier', () => {
    expect(resolveTreeClassList({ virtual: false, disabled: true })).toEqual([
      'cx-ui-tree',
      'cx-ui-tree--disabled',
    ]);
  });

  it('both virtual and disabled adds both modifiers', () => {
    expect(resolveTreeClassList({ virtual: true, disabled: true })).toEqual([
      'cx-ui-tree',
      'cx-ui-tree--virtual',
      'cx-ui-tree--disabled',
    ]);
  });
});

describe('resolveTreeRowClassList', () => {
  it('default returns base class only', () => {
    expect(resolveTreeRowClassList({ selected: false, disabled: false, loading: false })).toEqual([
      'cx-ui-tree__row',
    ]);
  });

  it('selected adds --selected modifier', () => {
    expect(resolveTreeRowClassList({ selected: true, disabled: false, loading: false })).toEqual([
      'cx-ui-tree__row',
      'cx-ui-tree__row--selected',
    ]);
  });

  it('disabled adds --disabled modifier', () => {
    expect(resolveTreeRowClassList({ selected: false, disabled: true, loading: false })).toEqual([
      'cx-ui-tree__row',
      'cx-ui-tree__row--disabled',
    ]);
  });

  it('loading adds --loading modifier', () => {
    expect(resolveTreeRowClassList({ selected: false, disabled: false, loading: true })).toEqual([
      'cx-ui-tree__row',
      'cx-ui-tree__row--loading',
    ]);
  });
});

describe('resolveTreeArrowClassList', () => {
  it('default returns base class only', () => {
    expect(resolveTreeArrowClassList({ expanded: false })).toEqual(['cx-ui-tree__arrow']);
  });

  it('expanded adds --expanded modifier', () => {
    expect(resolveTreeArrowClassList({ expanded: true })).toEqual([
      'cx-ui-tree__arrow',
      'cx-ui-tree__arrow--expanded',
    ]);
  });
});

describe('resolveTreeDropIndicatorClassList', () => {
  it('before position', () => {
    expect(resolveTreeDropIndicatorClassList({ position: 'before' })).toEqual([
      'cx-ui-tree__drop-indicator',
      'cx-ui-tree__drop-indicator--before',
    ]);
  });

  it('inside position', () => {
    expect(resolveTreeDropIndicatorClassList({ position: 'inside' })).toEqual([
      'cx-ui-tree__drop-indicator',
      'cx-ui-tree__drop-indicator--inside',
    ]);
  });

  it('after position', () => {
    expect(resolveTreeDropIndicatorClassList({ position: 'after' })).toEqual([
      'cx-ui-tree__drop-indicator',
      'cx-ui-tree__drop-indicator--after',
    ]);
  });
});
