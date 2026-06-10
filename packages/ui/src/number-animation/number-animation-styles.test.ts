// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_NUMBER_ANIMATION_CSS,
  ensureChronixNumberAnimationStyles,
} from './number-animation-styles.js';

describe('CHRONIX_NUMBER_ANIMATION_CSS', () => {
  it('declares base class', () => {
    expect(CHRONIX_NUMBER_ANIMATION_CSS).toContain('.cx-ui-number-animation');
  });
});

describe('ensureChronixNumberAnimationStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixNumberAnimationStyles();
    ensureChronixNumberAnimationStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="number-animation"]').length).toBe(
      1,
    );
  });
});
