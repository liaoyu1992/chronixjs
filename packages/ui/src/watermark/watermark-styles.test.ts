// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_WATERMARK_CSS, ensureChronixWatermarkStyles } from './watermark-styles.js';

describe('CHRONIX_WATERMARK_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_WATERMARK_CSS).toContain('.cx-ui-watermark');
    expect(CHRONIX_WATERMARK_CSS).toContain('.cx-ui-watermark__content');
  });

  it('declares the repeat-tiling background-repeat rule', () => {
    expect(CHRONIX_WATERMARK_CSS).toContain('background-repeat: repeat');
  });

  it('positions the root relative to support the stacked content', () => {
    expect(CHRONIX_WATERMARK_CSS).toMatch(/\.cx-ui-watermark\s*\{[^}]*position:\s*relative/);
  });
});

describe('ensureChronixWatermarkStyles', () => {
  it('injects a <style data-chronix-ui="watermark"> tag exactly once', () => {
    ensureChronixWatermarkStyles();
    ensureChronixWatermarkStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="watermark"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-watermark');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="watermark"]').forEach((s) => s.remove());
    ensureChronixWatermarkStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="watermark"]');
    expect(styles.length).toBe(0);
  });
});
