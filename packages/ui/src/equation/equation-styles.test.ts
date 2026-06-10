// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_EQUATION_CSS, ensureChronixEquationStyles } from './equation-styles.js';

describe('CHRONIX_EQUATION_CSS', () => {
  it('declares base + 2 display modifiers', () => {
    expect(CHRONIX_EQUATION_CSS).toContain('.cx-ui-equation');
    expect(CHRONIX_EQUATION_CSS).toContain('.cx-ui-equation--inline');
    expect(CHRONIX_EQUATION_CSS).toContain('.cx-ui-equation--block');
  });
});

describe('ensureChronixEquationStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixEquationStyles();
    ensureChronixEquationStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="equation"]').length).toBe(1);
  });
});
