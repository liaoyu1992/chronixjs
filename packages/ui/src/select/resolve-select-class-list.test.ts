import { describe, expect, it } from 'vitest';

import {
  resolveSelectRootClassList,
  resolveSelectTriggerClassList,
  resolveSelectDropdownClassList,
  resolveSelectOptionClassList,
  resolveSelectArrowClassList,
  resolveSelectEmptyClassList,
  resolveSelectTagClassList,
  resolveSelectFilterInputClassList,
} from './resolve-select-class-list.js';

describe('resolveSelectRootClassList', () => {
  it('returns base class with no modifiers', () => {
    expect(
      resolveSelectRootClassList({
        multiple: false,
        disabled: false,
        filterable: false,
        open: false,
      }),
    ).toEqual(['cx-ui-select']);
  });

  it('adds --multiple when multiple', () => {
    const classes = resolveSelectRootClassList({
      multiple: true,
      disabled: false,
      filterable: false,
      open: false,
    });
    expect(classes).toContain('cx-ui-select--multiple');
  });

  it('adds --disabled when disabled', () => {
    const classes = resolveSelectRootClassList({
      multiple: false,
      disabled: true,
      filterable: false,
      open: false,
    });
    expect(classes).toContain('cx-ui-select--disabled');
  });

  it('adds --filterable when filterable', () => {
    const classes = resolveSelectRootClassList({
      multiple: false,
      disabled: false,
      filterable: true,
      open: false,
    });
    expect(classes).toContain('cx-ui-select--filterable');
  });

  it('adds --open when open', () => {
    const classes = resolveSelectRootClassList({
      multiple: false,
      disabled: false,
      filterable: false,
      open: true,
    });
    expect(classes).toContain('cx-ui-select--open');
  });
});

describe('resolveSelectTriggerClassList', () => {
  it('returns base class', () => {
    expect(
      resolveSelectTriggerClassList({ hasValue: false, active: false, placeholder: false }),
    ).toEqual(['cx-ui-select__trigger']);
  });

  it('adds all modifiers', () => {
    const classes = resolveSelectTriggerClassList({
      hasValue: true,
      active: true,
      placeholder: true,
    });
    expect(classes).toContain('cx-ui-select__trigger--has-value');
    expect(classes).toContain('cx-ui-select__trigger--active');
    expect(classes).toContain('cx-ui-select__trigger--placeholder');
  });
});

describe('resolveSelectDropdownClassList', () => {
  it('returns base class', () => {
    expect(resolveSelectDropdownClassList({ virtual: false })).toEqual(['cx-ui-select__dropdown']);
  });

  it('adds --virtual', () => {
    expect(resolveSelectDropdownClassList({ virtual: true })).toContain(
      'cx-ui-select__dropdown--virtual',
    );
  });
});

describe('resolveSelectOptionClassList', () => {
  it('returns base class', () => {
    expect(
      resolveSelectOptionClassList({
        selected: false,
        disabled: false,
        groupLabel: false,
        focused: false,
      }),
    ).toEqual(['cx-ui-select__option']);
  });

  it('adds all modifiers', () => {
    const classes = resolveSelectOptionClassList({
      selected: true,
      disabled: true,
      groupLabel: true,
      focused: true,
    });
    expect(classes).toContain('cx-ui-select__option--selected');
    expect(classes).toContain('cx-ui-select__option--disabled');
    expect(classes).toContain('cx-ui-select__option--group-label');
    expect(classes).toContain('cx-ui-select__option--focused');
  });
});

describe('resolveSelectArrowClassList', () => {
  it('returns base class', () => {
    expect(resolveSelectArrowClassList(false)).toEqual(['cx-ui-select__arrow']);
  });

  it('adds --active', () => {
    expect(resolveSelectArrowClassList(true)).toContain('cx-ui-select__arrow--active');
  });
});

describe('empty / tag / filter-input resolvers', () => {
  it('resolveSelectEmptyClassList returns expected', () => {
    expect(resolveSelectEmptyClassList()).toEqual(['cx-ui-select__empty']);
  });

  it('resolveSelectTagClassList returns expected', () => {
    expect(resolveSelectTagClassList()).toEqual(['cx-ui-select__tag']);
  });

  it('resolveSelectFilterInputClassList returns expected', () => {
    expect(resolveSelectFilterInputClassList()).toEqual(['cx-ui-select__filter-input']);
  });
});
