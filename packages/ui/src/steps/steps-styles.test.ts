// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_STEPS_CSS, ensureChronixStepsStyles } from './steps-styles.js';

describe('CHRONIX_STEPS_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps__item');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps__indicator');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps__index');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps__content');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps__title');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps__description');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps__separator');
  });

  it('declares both direction modifiers', () => {
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps--horizontal');
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps--vertical');
  });

  it('declares all 4 status modifiers', () => {
    for (const s of ['wait', 'process', 'finish', 'error']) {
      expect(CHRONIX_STEPS_CSS).toContain(`.cx-ui-steps__item--${s}`);
    }
  });

  it('declares the --has-error aggregate modifier', () => {
    expect(CHRONIX_STEPS_CSS).toContain('.cx-ui-steps--has-error');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_STEPS_CSS).toContain('var(--cx-ui-steps-text-color,');
    expect(CHRONIX_STEPS_CSS).toContain('var(--cx-ui-steps-indicator-bg-process,');
    expect(CHRONIX_STEPS_CSS).toContain('var(--cx-ui-steps-indicator-bg-finish,');
    expect(CHRONIX_STEPS_CSS).toContain('var(--cx-ui-steps-indicator-bg-error,');
  });
});

describe('ensureChronixStepsStyles', () => {
  it('injects a <style data-chronix-ui="steps"> tag exactly once', () => {
    ensureChronixStepsStyles();
    ensureChronixStepsStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="steps"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-steps');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="steps"]').forEach((s) => s.remove());
    ensureChronixStepsStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="steps"]');
    expect(styles.length).toBe(0);
  });
});
