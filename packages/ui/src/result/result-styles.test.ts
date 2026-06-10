// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_RESULT_CSS, ensureChronixResultStyles } from './result-styles.js';

describe('CHRONIX_RESULT_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_RESULT_CSS).toContain('.cx-ui-result');
    expect(CHRONIX_RESULT_CSS).toContain('.cx-ui-result__icon');
    expect(CHRONIX_RESULT_CSS).toContain('.cx-ui-result__title');
    expect(CHRONIX_RESULT_CSS).toContain('.cx-ui-result__description');
    expect(CHRONIX_RESULT_CSS).toContain('.cx-ui-result__extra');
  });

  it('declares all 5 semantic-color status selectors', () => {
    for (const s of ['default', 'info', 'success', 'warning', 'error']) {
      expect(CHRONIX_RESULT_CSS).toContain(`.cx-ui-result--status-${s}`);
    }
  });

  it('declares all 4 HTTP-code status selectors', () => {
    for (const s of ['404', '403', '500', '418']) {
      expect(CHRONIX_RESULT_CSS).toContain(`.cx-ui-result--status-${s}`);
    }
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_RESULT_CSS).toContain('var(--cx-ui-result-title-color,');
    expect(CHRONIX_RESULT_CSS).toContain('var(--cx-ui-result-title-color-success,');
    expect(CHRONIX_RESULT_CSS).toContain('var(--cx-ui-result-title-color-error,');
  });
});

describe('ensureChronixResultStyles', () => {
  it('injects a <style data-chronix-ui="result"> tag exactly once', () => {
    ensureChronixResultStyles();
    ensureChronixResultStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="result"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-result');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="result"]').forEach((s) => s.remove());
    ensureChronixResultStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="result"]');
    expect(styles.length).toBe(0);
  });
});
