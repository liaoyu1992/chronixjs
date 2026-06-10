// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_STATISTIC_CSS, ensureChronixStatisticStyles } from './statistic-styles.js';

describe('CHRONIX_STATISTIC_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_STATISTIC_CSS).toContain('.cx-ui-statistic');
    expect(CHRONIX_STATISTIC_CSS).toContain('.cx-ui-statistic__label');
    expect(CHRONIX_STATISTIC_CSS).toContain('.cx-ui-statistic__content');
    expect(CHRONIX_STATISTIC_CSS).toContain('.cx-ui-statistic__prefix');
    expect(CHRONIX_STATISTIC_CSS).toContain('.cx-ui-statistic__value');
    expect(CHRONIX_STATISTIC_CSS).toContain('.cx-ui-statistic__suffix');
  });

  it('declares the tabular-nums modifier with font-variant-numeric', () => {
    expect(CHRONIX_STATISTIC_CSS).toContain('.cx-ui-statistic--tabular-nums');
    expect(CHRONIX_STATISTIC_CSS).toContain('font-variant-numeric: tabular-nums');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_STATISTIC_CSS).toContain('var(--cx-ui-statistic-value-color,');
    expect(CHRONIX_STATISTIC_CSS).toContain('var(--cx-ui-statistic-label-color,');
  });
});

describe('ensureChronixStatisticStyles', () => {
  it('injects a <style data-chronix-ui="statistic"> tag exactly once', () => {
    ensureChronixStatisticStyles();
    ensureChronixStatisticStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="statistic"]');
    expect(styles.length).toBe(1);
  });
});
