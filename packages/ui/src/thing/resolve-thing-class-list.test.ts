import { describe, expect, it } from 'vitest';

import { resolveThingClassList, type ThingClassListInput } from './resolve-thing-class-list.js';
import { defaultThingProps, type ThingProps } from './thing-spec.js';

function input(over: Partial<ThingClassListInput> = {}): ThingClassListInput {
  return {
    props: defaultThingProps,
    hasAvatar: false,
    hasHeader: false,
    hasHeaderExtra: false,
    hasDescription: false,
    hasContent: false,
    hasAction: false,
    hasFooter: false,
    ...over,
  };
}

describe('resolveThingClassList', () => {
  it('returns base only when no slots / props resolve to content', () => {
    expect(resolveThingClassList(input())).toEqual(['cx-ui-thing']);
  });

  it('adds --with-avatar when hasAvatar', () => {
    expect(resolveThingClassList(input({ hasAvatar: true }))).toContain('cx-ui-thing--with-avatar');
  });

  it('adds --with-header when hasHeader', () => {
    expect(resolveThingClassList(input({ hasHeader: true }))).toContain('cx-ui-thing--with-header');
  });

  it('adds --with-header-extra when hasHeaderExtra', () => {
    expect(resolveThingClassList(input({ hasHeaderExtra: true }))).toContain(
      'cx-ui-thing--with-header-extra',
    );
  });

  it('adds --with-description when hasDescription', () => {
    expect(resolveThingClassList(input({ hasDescription: true }))).toContain(
      'cx-ui-thing--with-description',
    );
  });

  it('adds --with-content when hasContent', () => {
    expect(resolveThingClassList(input({ hasContent: true }))).toContain(
      'cx-ui-thing--with-content',
    );
  });

  it('adds --with-action when hasAction', () => {
    expect(resolveThingClassList(input({ hasAction: true }))).toContain('cx-ui-thing--with-action');
  });

  it('adds --with-footer when hasFooter', () => {
    expect(resolveThingClassList(input({ hasFooter: true }))).toContain('cx-ui-thing--with-footer');
  });

  it('adds --content-indented when props.contentIndented is true', () => {
    const props: ThingProps = { ...defaultThingProps, contentIndented: true };
    expect(resolveThingClassList(input({ props }))).toContain('cx-ui-thing--content-indented');
  });

  it('omits --content-indented when props.contentIndented is false', () => {
    expect(resolveThingClassList(input({ props: defaultThingProps }))).not.toContain(
      'cx-ui-thing--content-indented',
    );
  });

  it('combines all 8 modifiers when every slot resolves and contentIndented=true', () => {
    const props: ThingProps = {
      title: 'Heading',
      description: 'Sub',
      contentIndented: true,
    };
    expect(
      resolveThingClassList(
        input({
          props,
          hasAvatar: true,
          hasHeader: true,
          hasHeaderExtra: true,
          hasDescription: true,
          hasContent: true,
          hasAction: true,
          hasFooter: true,
        }),
      ),
    ).toEqual([
      'cx-ui-thing',
      'cx-ui-thing--with-avatar',
      'cx-ui-thing--with-header',
      'cx-ui-thing--with-header-extra',
      'cx-ui-thing--with-description',
      'cx-ui-thing--with-content',
      'cx-ui-thing--with-action',
      'cx-ui-thing--with-footer',
      'cx-ui-thing--content-indented',
    ]);
  });

  it('returns a fresh array per call', () => {
    expect(resolveThingClassList(input())).not.toBe(resolveThingClassList(input()));
  });
});
