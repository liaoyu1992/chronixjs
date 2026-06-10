// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_EMPTY_CSS, ensureChronixEmptyStyles } from './empty-styles.js';

describe('CHRONIX_EMPTY_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_EMPTY_CSS).toContain('.cx-ui-empty');
    expect(CHRONIX_EMPTY_CSS).toContain('.cx-ui-empty__icon');
    expect(CHRONIX_EMPTY_CSS).toContain('.cx-ui-empty__description');
    expect(CHRONIX_EMPTY_CSS).toContain('.cx-ui-empty__extra');
  });

  it('declares all 3 size modifiers', () => {
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_EMPTY_CSS).toContain(`.cx-ui-empty--${s}`);
    }
  });
});

describe('ensureChronixEmptyStyles', () => {
  it('injects a <style data-chronix-ui="empty"> tag exactly once across multiple calls', () => {
    ensureChronixEmptyStyles();
    ensureChronixEmptyStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="empty"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-empty');
  });
});
