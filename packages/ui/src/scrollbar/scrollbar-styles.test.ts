// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_SCROLLBAR_CSS, ensureChronixScrollbarStyles } from './scrollbar-styles.js';

describe('CHRONIX_SCROLLBAR_CSS', () => {
  it('declares base + container + rail + thumb + modifiers', () => {
    expect(CHRONIX_SCROLLBAR_CSS).toContain('.cx-ui-scrollbar');
    expect(CHRONIX_SCROLLBAR_CSS).toContain('.cx-ui-scrollbar__container');
    expect(CHRONIX_SCROLLBAR_CSS).toContain('.cx-ui-scrollbar__rail');
    expect(CHRONIX_SCROLLBAR_CSS).toContain('.cx-ui-scrollbar__thumb');
    expect(CHRONIX_SCROLLBAR_CSS).toContain('.cx-ui-scrollbar--hover');
    expect(CHRONIX_SCROLLBAR_CSS).toContain('.cx-ui-scrollbar--none');
  });

  it('includes webkit scrollbar selectors', () => {
    expect(CHRONIX_SCROLLBAR_CSS).toContain('::-webkit-scrollbar');
    expect(CHRONIX_SCROLLBAR_CSS).toContain('::-webkit-scrollbar-thumb');
    expect(CHRONIX_SCROLLBAR_CSS).toContain('::-webkit-scrollbar-track');
  });
});

describe('ensureChronixScrollbarStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixScrollbarStyles();
    ensureChronixScrollbarStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="scrollbar"]').length).toBe(1);
  });
});
