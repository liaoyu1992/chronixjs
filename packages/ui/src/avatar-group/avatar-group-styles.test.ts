// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_AVATAR_GROUP_CSS, ensureChronixAvatarGroupStyles } from './avatar-group-styles.js';

describe('CHRONIX_AVATAR_GROUP_CSS', () => {
  it('declares base + __overflow element + overlap rule', () => {
    expect(CHRONIX_AVATAR_GROUP_CSS).toContain('.cx-ui-avatar-group');
    expect(CHRONIX_AVATAR_GROUP_CSS).toContain('.cx-ui-avatar-group__overflow');
    expect(CHRONIX_AVATAR_GROUP_CSS).toContain(':not(:first-child)');
  });
});

describe('ensureChronixAvatarGroupStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixAvatarGroupStyles();
    ensureChronixAvatarGroupStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="avatar-group"]').length).toBe(1);
  });
});
