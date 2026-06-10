// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_ANCHOR_CSS, ensureChronixAnchorStyles } from './anchor-styles.js';

describe('CHRONIX_ANCHOR_CSS', () => {
  it('declares base + modifiers + link + active', () => {
    expect(CHRONIX_ANCHOR_CSS).toContain('.cx-ui-anchor');
    expect(CHRONIX_ANCHOR_CSS).toContain('.cx-ui-anchor--show-rail');
    expect(CHRONIX_ANCHOR_CSS).toContain('.cx-ui-anchor--show-background');
    expect(CHRONIX_ANCHOR_CSS).toContain('.cx-ui-anchor__link');
    expect(CHRONIX_ANCHOR_CSS).toContain('.cx-ui-anchor__link--active');
  });
});

describe('ensureChronixAnchorStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixAnchorStyles();
    ensureChronixAnchorStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="anchor"]').length).toBe(1);
  });
});
