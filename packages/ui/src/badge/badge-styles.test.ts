// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_BADGE_CSS, ensureChronixBadgeStyles } from './badge-styles.js';

describe('CHRONIX_BADGE_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_BADGE_CSS).toContain('.cx-ui-badge');
    expect(CHRONIX_BADGE_CSS).toContain('.cx-ui-badge__sup');
  });

  it('declares all 5 type modifiers', () => {
    for (const t of ['default', 'success', 'warning', 'error', 'info']) {
      expect(CHRONIX_BADGE_CSS).toContain(`.cx-ui-badge__sup--${t}`);
    }
  });

  it('declares standalone / dot / processing / hidden modifiers + pulse keyframes', () => {
    expect(CHRONIX_BADGE_CSS).toContain('.cx-ui-badge--standalone');
    expect(CHRONIX_BADGE_CSS).toContain('.cx-ui-badge__sup--dot');
    expect(CHRONIX_BADGE_CSS).toContain('.cx-ui-badge__sup--processing');
    expect(CHRONIX_BADGE_CSS).toContain('.cx-ui-badge__sup--hidden');
    expect(CHRONIX_BADGE_CSS).toContain('@keyframes cx-ui-badge-pulse');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_BADGE_CSS).toContain('var(--cx-ui-badge-bg-color,');
    expect(CHRONIX_BADGE_CSS).toContain('var(--cx-ui-badge-bg-color-success,');
  });
});

describe('ensureChronixBadgeStyles', () => {
  it('injects a <style data-chronix-ui="badge"> tag exactly once across multiple calls', () => {
    ensureChronixBadgeStyles();
    ensureChronixBadgeStyles();
    ensureChronixBadgeStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="badge"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-badge');
  });

  it('does not re-inject after a previous <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="badge"]').forEach((s) => s.remove());
    ensureChronixBadgeStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="badge"]');
    expect(styles.length).toBe(0);
  });
});
