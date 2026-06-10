// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_INFINITE_SCROLL_CSS,
  ensureChronixInfiniteScrollStyles,
} from './infinite-scroll-styles.js';

describe('CHRONIX_INFINITE_SCROLL_CSS', () => {
  it('declares base + content + sentinel + loading', () => {
    expect(CHRONIX_INFINITE_SCROLL_CSS).toContain('.cx-ui-infinite-scroll');
    expect(CHRONIX_INFINITE_SCROLL_CSS).toContain('.cx-ui-infinite-scroll__content');
    expect(CHRONIX_INFINITE_SCROLL_CSS).toContain('.cx-ui-infinite-scroll__sentinel');
    expect(CHRONIX_INFINITE_SCROLL_CSS).toContain('.cx-ui-infinite-scroll__loading');
  });
});

describe('ensureChronixInfiniteScrollStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixInfiniteScrollStyles();
    ensureChronixInfiniteScrollStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="infinite-scroll"]').length).toBe(
      1,
    );
  });
});
