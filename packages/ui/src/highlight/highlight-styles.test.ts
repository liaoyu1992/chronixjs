// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_HIGHLIGHT_CSS, ensureChronixHighlightStyles } from './highlight-styles.js';

describe('CHRONIX_HIGHLIGHT_CSS', () => {
  it('declares base + __match element', () => {
    expect(CHRONIX_HIGHLIGHT_CSS).toContain('.cx-ui-highlight');
    expect(CHRONIX_HIGHLIGHT_CSS).toContain('.cx-ui-highlight__match');
  });
});

describe('ensureChronixHighlightStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixHighlightStyles();
    ensureChronixHighlightStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="highlight"]').length).toBe(1);
  });
});
