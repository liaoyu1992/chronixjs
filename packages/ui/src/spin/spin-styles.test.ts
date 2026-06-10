// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_SPIN_CSS, ensureChronixSpinStyles } from './spin-styles.js';

describe('CHRONIX_SPIN_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_SPIN_CSS).toContain('.cx-ui-spin');
    expect(CHRONIX_SPIN_CSS).toContain('.cx-ui-spin__indicator');
    expect(CHRONIX_SPIN_CSS).toContain('.cx-ui-spin__description');
  });

  it('declares all 3 size modifiers', () => {
    for (const s of ['small', 'medium', 'large']) {
      expect(CHRONIX_SPIN_CSS).toContain(`.cx-ui-spin--${s}`);
    }
  });

  it('declares --hidden + rotate keyframes for indicator animation', () => {
    expect(CHRONIX_SPIN_CSS).toContain('.cx-ui-spin--hidden');
    expect(CHRONIX_SPIN_CSS).toContain('@keyframes cx-ui-spin-rotate');
    expect(CHRONIX_SPIN_CSS).toContain('border-top-color');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_SPIN_CSS).toContain('var(--cx-ui-spin-color,');
    expect(CHRONIX_SPIN_CSS).toContain('var(--cx-ui-spin-track-color,');
  });
});

describe('ensureChronixSpinStyles', () => {
  it('injects a <style data-chronix-ui="spin"> tag exactly once across multiple calls', () => {
    ensureChronixSpinStyles();
    ensureChronixSpinStyles();
    ensureChronixSpinStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="spin"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-spin');
  });

  it('does not re-inject after a previous <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="spin"]').forEach((s) => s.remove());
    ensureChronixSpinStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="spin"]');
    expect(styles.length).toBe(0);
  });
});
