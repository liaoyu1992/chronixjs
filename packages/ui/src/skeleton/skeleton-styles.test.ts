// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_SKELETON_CSS, ensureChronixSkeletonStyles } from './skeleton-styles.js';

describe('CHRONIX_SKELETON_CSS', () => {
  it('contains the base class', () => {
    expect(CHRONIX_SKELETON_CSS).toContain('.cx-ui-skeleton');
  });

  it('declares all 3 shape modifiers', () => {
    for (const s of ['text', 'rect', 'circle']) {
      expect(CHRONIX_SKELETON_CSS).toContain(`.cx-ui-skeleton--${s}`);
    }
  });

  it('declares --animated + --round modifiers + shimmer keyframes', () => {
    expect(CHRONIX_SKELETON_CSS).toContain('.cx-ui-skeleton--animated');
    expect(CHRONIX_SKELETON_CSS).toContain('.cx-ui-skeleton--round');
    expect(CHRONIX_SKELETON_CSS).toContain('@keyframes cx-ui-skeleton-shimmer');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_SKELETON_CSS).toContain('var(--cx-ui-skeleton-color,');
    expect(CHRONIX_SKELETON_CSS).toContain('var(--cx-ui-skeleton-highlight,');
  });
});

describe('ensureChronixSkeletonStyles', () => {
  it('injects a <style data-chronix-ui="skeleton"> tag exactly once', () => {
    ensureChronixSkeletonStyles();
    ensureChronixSkeletonStyles();
    ensureChronixSkeletonStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="skeleton"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-skeleton');
  });

  it('does not re-inject after a previous <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="skeleton"]').forEach((s) => s.remove());
    ensureChronixSkeletonStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="skeleton"]');
    expect(styles.length).toBe(0);
  });
});
