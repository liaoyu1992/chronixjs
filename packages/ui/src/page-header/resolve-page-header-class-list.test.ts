import { describe, expect, it } from 'vitest';

import { defaultPageHeaderProps } from './page-header-spec.js';
import {
  resolvePageHeaderClassList,
  type PageHeaderClassListInput,
} from './resolve-page-header-class-list.js';

function makeInput(overrides: Partial<PageHeaderClassListInput> = {}): PageHeaderClassListInput {
  return {
    props: defaultPageHeaderProps,
    hasTitle: false,
    hasSubtitle: false,
    hasAvatar: false,
    hasExtra: false,
    hasFooter: false,
    hasContent: false,
    ...overrides,
  };
}

describe('resolvePageHeaderClassList', () => {
  it('returns just the base class for default props + no slots', () => {
    expect(resolvePageHeaderClassList(makeInput())).toEqual(['cx-ui-page-header']);
  });

  it('adds --inverted when props.inverted is true', () => {
    const classes = resolvePageHeaderClassList(
      makeInput({ props: { ...defaultPageHeaderProps, inverted: true } }),
    );
    expect(classes).toContain('cx-ui-page-header--inverted');
  });

  it('adds --with-back when props.back is true', () => {
    const classes = resolvePageHeaderClassList(
      makeInput({ props: { ...defaultPageHeaderProps, back: true } }),
    );
    expect(classes).toContain('cx-ui-page-header--with-back');
  });

  it('adds --with-avatar when hasAvatar is true', () => {
    expect(resolvePageHeaderClassList(makeInput({ hasAvatar: true }))).toContain(
      'cx-ui-page-header--with-avatar',
    );
  });

  it('adds --with-title when hasTitle is true', () => {
    expect(resolvePageHeaderClassList(makeInput({ hasTitle: true }))).toContain(
      'cx-ui-page-header--with-title',
    );
  });

  it('adds --with-subtitle when hasSubtitle is true', () => {
    expect(resolvePageHeaderClassList(makeInput({ hasSubtitle: true }))).toContain(
      'cx-ui-page-header--with-subtitle',
    );
  });

  it('adds --with-extra when hasExtra is true', () => {
    expect(resolvePageHeaderClassList(makeInput({ hasExtra: true }))).toContain(
      'cx-ui-page-header--with-extra',
    );
  });

  it('adds --with-footer when hasFooter is true', () => {
    expect(resolvePageHeaderClassList(makeInput({ hasFooter: true }))).toContain(
      'cx-ui-page-header--with-footer',
    );
  });

  it('adds --with-content when hasContent is true', () => {
    expect(resolvePageHeaderClassList(makeInput({ hasContent: true }))).toContain(
      'cx-ui-page-header--with-content',
    );
  });

  it('combines all 7 modifiers when every flag and prop is on', () => {
    const classes = resolvePageHeaderClassList(
      makeInput({
        props: {
          title: 'Project A',
          subtitle: 'Owned by you',
          back: true,
          inverted: true,
        },
        hasTitle: true,
        hasSubtitle: true,
        hasAvatar: true,
        hasExtra: true,
        hasFooter: true,
        hasContent: true,
      }),
    );
    expect(classes).toEqual([
      'cx-ui-page-header',
      'cx-ui-page-header--inverted',
      'cx-ui-page-header--with-back',
      'cx-ui-page-header--with-avatar',
      'cx-ui-page-header--with-title',
      'cx-ui-page-header--with-subtitle',
      'cx-ui-page-header--with-extra',
      'cx-ui-page-header--with-footer',
      'cx-ui-page-header--with-content',
    ]);
  });

  it('returns a fresh array per call', () => {
    const a = resolvePageHeaderClassList(makeInput());
    const b = resolvePageHeaderClassList(makeInput());
    expect(a).not.toBe(b);
  });
});
