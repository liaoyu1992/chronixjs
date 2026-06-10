// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_TAG_CSS, ensureChronixTagStyles } from './tag-styles.js';

describe('CHRONIX_TAG_CSS', () => {
  it('contains the base BEM class', () => {
    expect(CHRONIX_TAG_CSS).toContain('.cx-ui-tag');
  });

  it('declares all 6 type modifiers + 3 size modifiers', () => {
    for (const t of ['default', 'primary', 'info', 'success', 'warning', 'error']) {
      expect(CHRONIX_TAG_CSS).toContain(`.cx-ui-tag--${t}`);
    }
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_TAG_CSS).toContain(`.cx-ui-tag--${s}`);
    }
  });

  it('declares bordered / round / closable / disabled modifiers + __close element', () => {
    expect(CHRONIX_TAG_CSS).toContain('.cx-ui-tag--bordered');
    expect(CHRONIX_TAG_CSS).toContain('.cx-ui-tag--round');
    expect(CHRONIX_TAG_CSS).toContain('.cx-ui-tag--closable');
    expect(CHRONIX_TAG_CSS).toContain('.cx-ui-tag--disabled');
    expect(CHRONIX_TAG_CSS).toContain('.cx-ui-tag__close');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_TAG_CSS).toContain('var(--cx-ui-tag-bg-color,');
    expect(CHRONIX_TAG_CSS).toContain('var(--cx-ui-tag-bg-color-primary,');
  });
});

describe('ensureChronixTagStyles', () => {
  it('injects a <style data-chronix-ui="tag"> tag exactly once across multiple calls', () => {
    ensureChronixTagStyles();
    ensureChronixTagStyles();
    ensureChronixTagStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="tag"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-tag');
  });

  it('does not re-inject after a previous <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="tag"]').forEach((s) => s.remove());
    ensureChronixTagStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="tag"]');
    expect(styles.length).toBe(0);
  });
});
