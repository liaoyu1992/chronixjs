// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_GRID_CSS, ensureChronixGridStyles } from './grid-styles.js';

describe('CHRONIX_GRID_CSS', () => {
  it('contains the base class with display: grid', () => {
    expect(CHRONIX_GRID_CSS).toContain('.cx-ui-grid');
    expect(CHRONIX_GRID_CSS).toContain('display: grid');
  });

  it('declares the --inline modifier with display: inline-grid', () => {
    expect(CHRONIX_GRID_CSS).toContain('.cx-ui-grid--inline');
    expect(CHRONIX_GRID_CSS).toContain('display: inline-grid');
  });
});

describe('ensureChronixGridStyles', () => {
  it('injects a <style data-chronix-ui="grid"> tag exactly once', () => {
    ensureChronixGridStyles();
    ensureChronixGridStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="grid"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-grid');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="grid"]').forEach((s) => s.remove());
    ensureChronixGridStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="grid"]');
    expect(styles.length).toBe(0);
  });
});
