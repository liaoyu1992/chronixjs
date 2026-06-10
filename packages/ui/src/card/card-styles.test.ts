// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_CARD_CSS, ensureChronixCardStyles } from './card-styles.js';

describe('CHRONIX_CARD_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_CARD_CSS).toContain('.cx-ui-card');
    expect(CHRONIX_CARD_CSS).toContain('.cx-ui-card__header');
    expect(CHRONIX_CARD_CSS).toContain('.cx-ui-card__content');
    expect(CHRONIX_CARD_CSS).toContain('.cx-ui-card__footer');
  });

  it('declares all 3 size modifiers', () => {
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_CARD_CSS).toContain(`.cx-ui-card--${s}`);
    }
  });

  it('declares bordered + hoverable + embedded modifiers', () => {
    expect(CHRONIX_CARD_CSS).toContain('.cx-ui-card--bordered');
    expect(CHRONIX_CARD_CSS).toContain('.cx-ui-card--hoverable');
    expect(CHRONIX_CARD_CSS).toContain('.cx-ui-card--embedded');
  });
});

describe('ensureChronixCardStyles', () => {
  it('injects a <style data-chronix-ui="card"> tag exactly once across multiple calls', () => {
    ensureChronixCardStyles();
    ensureChronixCardStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="card"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-card');
  });
});
