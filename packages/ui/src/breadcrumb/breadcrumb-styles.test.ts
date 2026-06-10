// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_BREADCRUMB_CSS, ensureChronixBreadcrumbStyles } from './breadcrumb-styles.js';

describe('CHRONIX_BREADCRUMB_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_BREADCRUMB_CSS).toContain('.cx-ui-breadcrumb');
    expect(CHRONIX_BREADCRUMB_CSS).toContain('.cx-ui-breadcrumb__item');
    expect(CHRONIX_BREADCRUMB_CSS).toContain('.cx-ui-breadcrumb__separator');
  });

  it('declares the --clickable and --current modifiers', () => {
    expect(CHRONIX_BREADCRUMB_CSS).toContain('.cx-ui-breadcrumb__item--clickable');
    expect(CHRONIX_BREADCRUMB_CSS).toContain('.cx-ui-breadcrumb__item--current');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_BREADCRUMB_CSS).toContain('var(--cx-ui-breadcrumb-text-color,');
    expect(CHRONIX_BREADCRUMB_CSS).toContain('var(--cx-ui-breadcrumb-link-color,');
    expect(CHRONIX_BREADCRUMB_CSS).toContain('var(--cx-ui-breadcrumb-current-color,');
    expect(CHRONIX_BREADCRUMB_CSS).toContain('var(--cx-ui-breadcrumb-separator-color,');
  });
});

describe('ensureChronixBreadcrumbStyles', () => {
  it('injects a <style data-chronix-ui="breadcrumb"> tag exactly once', () => {
    ensureChronixBreadcrumbStyles();
    ensureChronixBreadcrumbStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="breadcrumb"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-breadcrumb');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head
      .querySelectorAll('style[data-chronix-ui="breadcrumb"]')
      .forEach((s) => s.remove());
    ensureChronixBreadcrumbStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="breadcrumb"]');
    expect(styles.length).toBe(0);
  });
});
