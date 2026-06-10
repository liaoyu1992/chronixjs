// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_COLLAPSE_TRANSITION_CSS,
  ensureChronixCollapseTransitionStyles,
} from './collapse-transition-styles.js';

describe('CHRONIX_COLLAPSE_TRANSITION_CSS', () => {
  it('declares root + expanded BEM', () => {
    expect(CHRONIX_COLLAPSE_TRANSITION_CSS).toContain('.cx-ui-collapse-transition');
    expect(CHRONIX_COLLAPSE_TRANSITION_CSS).toContain('.cx-ui-collapse-transition--expanded');
  });
});

describe('ensureChronixCollapseTransitionStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixCollapseTransitionStyles();
    ensureChronixCollapseTransitionStyles();
    expect(
      document.head.querySelectorAll('style[data-chronix-ui="collapse-transition"]').length,
    ).toBe(1);
  });
});
