// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_LIST_CSS, ensureChronixListStyles } from './list-styles.js';

describe('CHRONIX_LIST_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list__item');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list__prefix');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list__main');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list__suffix');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list__title');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list__description');
  });

  it('declares all 3 size modifier selectors', () => {
    for (const size of ['small', 'medium', 'large']) {
      expect(CHRONIX_LIST_CSS).toContain(`.cx-ui-list--${size}`);
    }
  });

  it('declares root flag modifier selectors (bordered + hoverable + with-divider)', () => {
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list--bordered');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list--hoverable');
    expect(CHRONIX_LIST_CSS).toContain('.cx-ui-list--with-divider');
  });

  it('resets <ul> user-agent CSS defaults (list-style + margin + padding)', () => {
    expect(CHRONIX_LIST_CSS).toContain('list-style: none');
    expect(CHRONIX_LIST_CSS).toMatch(/\.cx-ui-list\s*\{[^}]*margin:\s*0/);
    expect(CHRONIX_LIST_CSS).toMatch(/\.cx-ui-list\s*\{[^}]*padding:\s*0/);
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_LIST_CSS).toContain('var(--cx-ui-list-font-size,');
    expect(CHRONIX_LIST_CSS).toContain('var(--cx-ui-list-item-hover-bg,');
    expect(CHRONIX_LIST_CSS).toContain('var(--cx-ui-list-divider-color,');
    expect(CHRONIX_LIST_CSS).toContain('var(--cx-ui-list-border-color,');
  });
});

describe('ensureChronixListStyles', () => {
  it('injects a <style data-chronix-ui="list"> tag exactly once', () => {
    ensureChronixListStyles();
    ensureChronixListStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="list"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-list');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="list"]').forEach((s) => s.remove());
    ensureChronixListStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="list"]');
    expect(styles.length).toBe(0);
  });
});
