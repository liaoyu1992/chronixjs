// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_COUNTDOWN_CSS, ensureChronixCountdownStyles } from './countdown-styles.js';

describe('CHRONIX_COUNTDOWN_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_COUNTDOWN_CSS).toContain('.cx-ui-countdown');
    expect(CHRONIX_COUNTDOWN_CSS).toContain('.cx-ui-countdown__label');
    expect(CHRONIX_COUNTDOWN_CSS).toContain('.cx-ui-countdown__content');
    expect(CHRONIX_COUNTDOWN_CSS).toContain('.cx-ui-countdown__value');
  });

  it('declares the tabular-nums modifier with font-variant-numeric', () => {
    expect(CHRONIX_COUNTDOWN_CSS).toContain('.cx-ui-countdown--tabular-nums');
    expect(CHRONIX_COUNTDOWN_CSS).toContain('font-variant-numeric: tabular-nums');
  });

  it('declares the --paused modifier with opacity dampening', () => {
    expect(CHRONIX_COUNTDOWN_CSS).toContain('.cx-ui-countdown--paused');
    expect(CHRONIX_COUNTDOWN_CSS).toContain('opacity');
  });
});

describe('ensureChronixCountdownStyles', () => {
  it('injects a <style data-chronix-ui="countdown"> tag exactly once', () => {
    ensureChronixCountdownStyles();
    ensureChronixCountdownStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="countdown"]');
    expect(styles.length).toBe(1);
  });
});
