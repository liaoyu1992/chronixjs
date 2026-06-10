// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_DESCRIPTIONS_CSS,
  ensureChronixDescriptionsStyles,
} from './descriptions-styles.js';

describe('CHRONIX_DESCRIPTIONS_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions__title');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions__grid');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions__item');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions__label');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions__value');
  });

  it('declares all 3 size modifier selectors', () => {
    for (const size of ['small', 'medium', 'large']) {
      expect(CHRONIX_DESCRIPTIONS_CSS).toContain(`.cx-ui-descriptions--${size}`);
    }
  });

  it('declares both placement modifier selectors', () => {
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions--placement-left');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions--placement-top');
  });

  it('declares the bordered modifier selector', () => {
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('.cx-ui-descriptions--bordered');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('var(--cx-ui-descriptions-font-size,');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('var(--cx-ui-descriptions-label-color,');
    expect(CHRONIX_DESCRIPTIONS_CSS).toContain('var(--cx-ui-descriptions-border-color,');
  });
});

describe('ensureChronixDescriptionsStyles', () => {
  it('injects a <style data-chronix-ui="descriptions"> tag exactly once', () => {
    ensureChronixDescriptionsStyles();
    ensureChronixDescriptionsStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="descriptions"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-descriptions');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head
      .querySelectorAll('style[data-chronix-ui="descriptions"]')
      .forEach((s) => s.remove());
    ensureChronixDescriptionsStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="descriptions"]');
    expect(styles.length).toBe(0);
  });
});
