import { describe, expect, it } from 'vitest';

import {
  resolveMentionRootClassList,
  resolveMentionTextareaClassList,
  resolveMentionDropdownClassList,
  resolveMentionOptionClassList,
  resolveMentionEmptyClassList,
} from './resolve-mention-class-list.js';

describe('resolveMentionRootClassList', () => {
  it('returns base class', () => {
    expect(resolveMentionRootClassList({ disabled: false, open: false })).toEqual([
      'cx-ui-mention',
    ]);
  });

  it('adds --disabled when disabled', () => {
    expect(resolveMentionRootClassList({ disabled: true, open: false })).toContain(
      'cx-ui-mention--disabled',
    );
  });

  it('adds --open when open', () => {
    expect(resolveMentionRootClassList({ disabled: false, open: true })).toContain(
      'cx-ui-mention--open',
    );
  });
});

describe('resolveMentionOptionClassList', () => {
  it('returns base class', () => {
    expect(resolveMentionOptionClassList(false, false, false)).toEqual(['cx-ui-mention__option']);
  });

  it('adds all modifiers', () => {
    const classes = resolveMentionOptionClassList(true, true, true);
    expect(classes).toContain('cx-ui-mention__option--selected');
    expect(classes).toContain('cx-ui-mention__option--focused');
    expect(classes).toContain('cx-ui-mention__option--disabled');
  });
});

describe('simple resolvers', () => {
  it('resolveMentionTextareaClassList', () => {
    expect(resolveMentionTextareaClassList()).toEqual(['cx-ui-mention__textarea']);
  });
  it('resolveMentionDropdownClassList', () => {
    expect(resolveMentionDropdownClassList()).toEqual(['cx-ui-mention__dropdown']);
  });
  it('resolveMentionEmptyClassList', () => {
    expect(resolveMentionEmptyClassList()).toEqual(['cx-ui-mention__empty']);
  });
});
