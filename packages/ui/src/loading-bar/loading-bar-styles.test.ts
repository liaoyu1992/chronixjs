// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_LOADING_BAR_CSS, ensureChronixLoadingBarStyles } from './loading-bar-styles.js';

describe('CHRONIX_LOADING_BAR_CSS', () => {
  it('contains the base class', () => {
    expect(CHRONIX_LOADING_BAR_CSS).toContain('.cx-ui-loading-bar');
  });

  it('declares loading, finishing, and error state modifiers', () => {
    expect(CHRONIX_LOADING_BAR_CSS).toContain('.cx-ui-loading-bar--loading');
    expect(CHRONIX_LOADING_BAR_CSS).toContain('.cx-ui-loading-bar--finishing');
    expect(CHRONIX_LOADING_BAR_CSS).toContain('.cx-ui-loading-bar--error');
  });

  it('does NOT declare an idle modifier (idle = hidden, no class)', () => {
    expect(CHRONIX_LOADING_BAR_CSS).not.toContain('.cx-ui-loading-bar--idle');
  });
});

describe('ensureChronixLoadingBarStyles', () => {
  it('injects a <style data-chronix-ui="loading-bar"> tag exactly once across multiple calls', () => {
    ensureChronixLoadingBarStyles();
    ensureChronixLoadingBarStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="loading-bar"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-loading-bar');
  });
});
