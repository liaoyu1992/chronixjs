// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_AVATAR_CSS, ensureChronixAvatarStyles } from './avatar-styles.js';

describe('CHRONIX_AVATAR_CSS', () => {
  it('declares base + 3 shape modifiers + __image', () => {
    expect(CHRONIX_AVATAR_CSS).toContain('.cx-ui-avatar');
    for (const s of ['circle', 'square', 'round']) {
      expect(CHRONIX_AVATAR_CSS).toContain(`.cx-ui-avatar--${s}`);
    }
    expect(CHRONIX_AVATAR_CSS).toContain('.cx-ui-avatar__image');
  });
});

describe('ensureChronixAvatarStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixAvatarStyles();
    ensureChronixAvatarStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="avatar"]').length).toBe(1);
  });
});
