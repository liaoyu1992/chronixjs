// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_THING_CSS, ensureChronixThingStyles } from './thing-styles.js';

describe('CHRONIX_THING_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__avatar');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__main');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__header');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__header-content');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__header-extra');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__description');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__content');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__action');
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing__footer');
  });

  it('declares flex-row root layout', () => {
    expect(CHRONIX_THING_CSS).toMatch(
      /\.cx-ui-thing\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*row/s,
    );
  });

  it('declares the --content-indented modifier rule', () => {
    expect(CHRONIX_THING_CSS).toContain('.cx-ui-thing--content-indented');
  });

  it('uses var() theme tokens with fallbacks', () => {
    expect(CHRONIX_THING_CSS).toContain('var(--cx-ui-font-family');
    expect(CHRONIX_THING_CSS).toContain('var(--cx-ui-thing-text-color');
    expect(CHRONIX_THING_CSS).toContain('var(--cx-ui-thing-header-color');
    expect(CHRONIX_THING_CSS).toContain('var(--cx-ui-thing-description-color');
  });

  it('justifies header-extra to the right within the header row', () => {
    expect(CHRONIX_THING_CSS).toMatch(
      /\.cx-ui-thing__header\s*\{[^}]*justify-content:\s*space-between/s,
    );
  });
});

describe('ensureChronixThingStyles', () => {
  it('injects a <style data-chronix-ui="thing"> tag exactly once', () => {
    ensureChronixThingStyles();
    ensureChronixThingStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="thing"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-thing');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="thing"]').forEach((s) => s.remove());
    ensureChronixThingStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="thing"]');
    expect(styles.length).toBe(0);
  });
});
