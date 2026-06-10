// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_PROGRESS_CSS, ensureChronixProgressStyles } from './progress-styles.js';

describe('CHRONIX_PROGRESS_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_PROGRESS_CSS).toContain('.cx-ui-progress');
    expect(CHRONIX_PROGRESS_CSS).toContain('.cx-ui-progress__rail');
    expect(CHRONIX_PROGRESS_CSS).toContain('.cx-ui-progress__fill');
    expect(CHRONIX_PROGRESS_CSS).toContain('.cx-ui-progress__info');
  });

  it('declares all 5 type modifiers', () => {
    for (const t of ['default', 'success', 'warning', 'error', 'info']) {
      expect(CHRONIX_PROGRESS_CSS).toContain(`.cx-ui-progress--${t}`);
    }
  });

  it('declares both info-placement modifiers', () => {
    expect(CHRONIX_PROGRESS_CSS).toContain('.cx-ui-progress--info-outside');
    expect(CHRONIX_PROGRESS_CSS).toContain('.cx-ui-progress--info-inside');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_PROGRESS_CSS).toContain('var(--cx-ui-progress-rail-color,');
    expect(CHRONIX_PROGRESS_CSS).toContain('var(--cx-ui-progress-fill-color,');
    expect(CHRONIX_PROGRESS_CSS).toContain('var(--cx-ui-progress-rail-height,');
  });
});

describe('ensureChronixProgressStyles', () => {
  it('injects a <style data-chronix-ui="progress"> tag exactly once', () => {
    ensureChronixProgressStyles();
    ensureChronixProgressStyles();
    ensureChronixProgressStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="progress"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-progress');
  });

  it('does not re-inject after a previous <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="progress"]').forEach((s) => s.remove());
    ensureChronixProgressStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="progress"]');
    expect(styles.length).toBe(0);
  });
});
