// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_MESSAGE_CSS, ensureChronixMessageStyles } from './message-styles.js';

describe('CHRONIX_MESSAGE_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_MESSAGE_CSS).toContain('.cx-ui-message');
    expect(CHRONIX_MESSAGE_CSS).toContain('.cx-ui-message__content');
    expect(CHRONIX_MESSAGE_CSS).toContain('.cx-ui-message__close');
  });

  it('declares all 5 type modifiers', () => {
    for (const t of ['info', 'success', 'warning', 'error', 'loading']) {
      expect(CHRONIX_MESSAGE_CSS).toContain(`.cx-ui-message--${t}`);
    }
  });

  it('declares enter / leave transition classes', () => {
    expect(CHRONIX_MESSAGE_CSS).toContain('.cx-ui-message--enter');
    expect(CHRONIX_MESSAGE_CSS).toContain('.cx-ui-message--leave');
  });
});

describe('ensureChronixMessageStyles', () => {
  it('injects a <style data-chronix-ui="message"> tag exactly once across multiple calls', () => {
    ensureChronixMessageStyles();
    ensureChronixMessageStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="message"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-message');
  });
});
