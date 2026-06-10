import { describe, expect, it } from 'vitest';

import {
  resolveTreeSelectRootClassList,
  resolveTreeSelectTriggerClassList,
  resolveTreeSelectDropdownClassList,
  resolveTreeSelectTreeClassList,
  resolveTreeSelectRowClassList,
  resolveTreeSelectArrowClassList,
  resolveTreeSelectEmptyClassList,
  resolveTreeSelectTagClassList,
} from './resolve-tree-select-class-list.js';

describe('resolveTreeSelectRootClassList', () => {
  it('returns base class', () => {
    expect(
      resolveTreeSelectRootClassList({ multiple: false, disabled: false, open: false }),
    ).toEqual(['cx-ui-tree-select']);
  });

  it('adds --multiple when multiple', () => {
    expect(
      resolveTreeSelectRootClassList({ multiple: true, disabled: false, open: false }),
    ).toContain('cx-ui-tree-select--multiple');
  });

  it('adds --open when open', () => {
    expect(
      resolveTreeSelectRootClassList({ multiple: false, disabled: false, open: true }),
    ).toContain('cx-ui-tree-select--open');
  });
});

describe('resolveTreeSelectTriggerClassList', () => {
  it('returns base class', () => {
    expect(resolveTreeSelectTriggerClassList(false, false, false)).toEqual([
      'cx-ui-tree-select__trigger',
    ]);
  });

  it('adds modifiers', () => {
    const classes = resolveTreeSelectTriggerClassList(true, true, true);
    expect(classes).toContain('cx-ui-tree-select__trigger--has-value');
    expect(classes).toContain('cx-ui-tree-select__trigger--active');
    expect(classes).toContain('cx-ui-tree-select__trigger--placeholder');
  });
});

describe('resolveTreeSelectRowClassList', () => {
  it('returns base class', () => {
    expect(resolveTreeSelectRowClassList(false, false, false)).toEqual([
      'cx-ui-tree-select__tree-row',
    ]);
  });

  it('adds all modifiers', () => {
    const classes = resolveTreeSelectRowClassList(true, true, true);
    expect(classes).toContain('cx-ui-tree-select__tree-row--selected');
    expect(classes).toContain('cx-ui-tree-select__tree-row--focused');
    expect(classes).toContain('cx-ui-tree-select__tree-row--disabled');
  });
});

describe('resolveTreeSelectArrowClassList', () => {
  it('returns base class', () => {
    expect(resolveTreeSelectArrowClassList(false)).toEqual(['cx-ui-tree-select__arrow']);
  });

  it('adds --active', () => {
    expect(resolveTreeSelectArrowClassList(true)).toContain('cx-ui-tree-select__arrow--active');
  });
});

describe('simple resolvers', () => {
  it('resolveTreeSelectDropdownClassList returns expected', () => {
    expect(resolveTreeSelectDropdownClassList()).toEqual(['cx-ui-tree-select__dropdown']);
  });
  it('resolveTreeSelectTreeClassList returns expected', () => {
    expect(resolveTreeSelectTreeClassList()).toEqual(['cx-ui-tree-select__tree']);
  });
  it('resolveTreeSelectEmptyClassList returns expected', () => {
    expect(resolveTreeSelectEmptyClassList()).toEqual(['cx-ui-tree-select__empty']);
  });
  it('resolveTreeSelectTagClassList returns expected', () => {
    expect(resolveTreeSelectTagClassList()).toEqual(['cx-ui-tree-select__tag']);
  });
});
