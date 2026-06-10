// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_DIVIDER_CSS, ensureChronixDividerStyles } from './divider-styles.js';

describe('CHRONIX_DIVIDER_CSS', () => {
  it('contains the base BEM class', () => {
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider');
  });

  it('declares horizontal + vertical orientation modifiers', () => {
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider--horizontal');
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider--vertical');
  });

  it('declares with-title + title-{placement} + dashed modifiers + __title element', () => {
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider--with-title');
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider--title-left');
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider--title-right');
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider--dashed');
    expect(CHRONIX_DIVIDER_CSS).toContain('.cx-ui-divider__title');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_DIVIDER_CSS).toContain('var(--cx-ui-divider-color,');
    expect(CHRONIX_DIVIDER_CSS).toContain('var(--cx-ui-divider-title-color,');
  });
});

describe('ensureChronixDividerStyles', () => {
  it('injects a <style data-chronix-ui="divider"> tag exactly once across multiple calls', () => {
    ensureChronixDividerStyles();
    ensureChronixDividerStyles();
    ensureChronixDividerStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="divider"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-divider');
  });

  it('does not re-inject after a previous <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="divider"]').forEach((s) => s.remove());
    ensureChronixDividerStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="divider"]');
    expect(styles.length).toBe(0);
  });
});
