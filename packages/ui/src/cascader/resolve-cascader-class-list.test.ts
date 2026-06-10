import { describe, expect, it } from 'vitest';

import {
  resolveCascaderRootClassList,
  resolveCascaderTriggerClassList,
  resolveCascaderDropdownClassList,
  resolveCascaderPanelClassList,
  resolveCascaderOptionClassList,
  resolveCascaderArrowClassList,
  resolveCascaderEmptyClassList,
} from './resolve-cascader-class-list.js';

describe('resolveCascaderRootClassList', () => {
  it('returns base class', () => {
    expect(resolveCascaderRootClassList({ multiple: false, disabled: false, open: false })).toEqual(
      ['cx-ui-cascader'],
    );
  });

  it('adds --multiple when multiple', () => {
    expect(
      resolveCascaderRootClassList({ multiple: true, disabled: false, open: false }),
    ).toContain('cx-ui-cascader--multiple');
  });

  it('adds --open when open', () => {
    expect(
      resolveCascaderRootClassList({ multiple: false, disabled: false, open: true }),
    ).toContain('cx-ui-cascader--open');
  });
});

describe('resolveCascaderTriggerClassList', () => {
  it('returns base class', () => {
    expect(resolveCascaderTriggerClassList(false, false, false)).toEqual([
      'cx-ui-cascader__trigger',
    ]);
  });
});

describe('resolveCascaderOptionClassList', () => {
  it('returns base class', () => {
    expect(resolveCascaderOptionClassList(false, false, false)).toEqual(['cx-ui-cascader__option']);
  });

  it('adds all modifiers', () => {
    const classes = resolveCascaderOptionClassList(true, true, true);
    expect(classes).toContain('cx-ui-cascader__option--selected');
    expect(classes).toContain('cx-ui-cascader__option--active');
    expect(classes).toContain('cx-ui-cascader__option--disabled');
  });
});

describe('simple resolvers', () => {
  it('resolveCascaderDropdownClassList', () => {
    expect(resolveCascaderDropdownClassList()).toEqual(['cx-ui-cascader__dropdown']);
  });
  it('resolveCascaderPanelClassList', () => {
    expect(resolveCascaderPanelClassList()).toEqual(['cx-ui-cascader__panel']);
  });
  it('resolveCascaderArrowClassList', () => {
    expect(resolveCascaderArrowClassList(false)).toEqual(['cx-ui-cascader__arrow']);
    expect(resolveCascaderArrowClassList(true)).toContain('cx-ui-cascader__arrow--active');
  });
  it('resolveCascaderEmptyClassList', () => {
    expect(resolveCascaderEmptyClassList()).toEqual(['cx-ui-cascader__empty']);
  });
});
