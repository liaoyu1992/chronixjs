// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_PAGE_HEADER_CSS, ensureChronixPageHeaderStyles } from './page-header-styles.js';

describe('CHRONIX_PAGE_HEADER_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__main');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__back-button');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__avatar');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__heading');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__title');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__subtitle');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__extra');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__content');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header__footer');
  });

  it('declares the --inverted modifier with inverted theme selectors', () => {
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('.cx-ui-page-header--inverted');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain(
      '.cx-ui-page-header--inverted .cx-ui-page-header__title',
    );
    expect(CHRONIX_PAGE_HEADER_CSS).toContain(
      '.cx-ui-page-header--inverted .cx-ui-page-header__subtitle',
    );
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('var(--cx-ui-page-header-text-color,');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('var(--cx-ui-page-header-title-color,');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('var(--cx-ui-page-header-subtitle-color,');
    expect(CHRONIX_PAGE_HEADER_CSS).toContain('var(--cx-ui-page-header-bg-inverted,');
  });
});

describe('ensureChronixPageHeaderStyles', () => {
  it('injects a <style data-chronix-ui="page-header"> tag exactly once', () => {
    ensureChronixPageHeaderStyles();
    ensureChronixPageHeaderStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="page-header"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-page-header');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head
      .querySelectorAll('style[data-chronix-ui="page-header"]')
      .forEach((s) => s.remove());
    ensureChronixPageHeaderStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="page-header"]');
    expect(styles.length).toBe(0);
  });
});
